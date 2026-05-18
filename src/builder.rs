// SPDX-License-Identifier: MIT OR Apache-2.0

use std::str::FromStr;
use std::sync::{Arc, Mutex};

use thiserror::Error;

use crate::core::{NetworkId, RelayUrl, SigningKey, VerifyingKey};
use crate::node::{Node, SpawnError};

/// Message acknowledgement policy for eventually-consistent topic streams.
///
/// Every `StreamSubscription` instance is stateful and keeps track of already acknowledged
/// operations by persisting them in the local SQLite database. Specifying a policy defines how and
/// when events are acknowledged.
///
/// Operations which have not been acknowledged yet will be automatically re-played when this stream
/// is created again.
#[derive(uniffi::Enum)]
pub enum AckPolicy {
    /// Each individual message must be acknowledged.
    Explicit,

    /// No manual acknowledgment needed, node assumes acknowledgment on delivery.
    Automatic,
}

impl From<AckPolicy> for p2panda::node::AckPolicy {
    fn from(value: AckPolicy) -> Self {
        match value {
            AckPolicy::Explicit => Self::Explicit,
            AckPolicy::Automatic => Self::Automatic,
        }
    }
}

/// mDNS discovery mode.
///
/// By default this is set to "active" meaning we are actively advertising our address and public
/// key on local-area networks.
#[derive(uniffi::Enum)]
pub enum MdnsDiscoveryMode {
    /// mDNS discovery disabled.
    Disabled,

    /// Advertise our own and listen for others' discovery announcements.
    Active,

    /// Listen for others' discovery announcements but don't advertise our own.
    Passive,
}

impl From<MdnsDiscoveryMode> for p2panda::network::MdnsDiscoveryMode {
    fn from(value: MdnsDiscoveryMode) -> Self {
        match value {
            MdnsDiscoveryMode::Disabled => Self::Disabled,
            MdnsDiscoveryMode::Active => Self::Active,
            MdnsDiscoveryMode::Passive => Self::Passive,
        }
    }
}

#[derive(Debug, Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum IpAddrError {
    #[error("could not parse invalid IPv4 or v6 address: {0}")]
    ParseInvalidAddr(String),
}

#[derive(Debug, Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum NodeBuilderError {
    #[error("builder was already consumed to spawn node, please create a new one")]
    AlreadyConsumed,

    #[error("thread holding the builder mutex panicked")]
    MutexPoisoned,

    #[error(transparent)]
    IpAddr(#[from] IpAddrError),
}

/// Builder for `Node`.
#[derive(uniffi::Object)]
pub struct NodeBuilder(Mutex<Option<p2panda::NodeBuilder>>);

impl NodeBuilder {
    fn update(
        &self,
        update_fn: impl FnOnce(p2panda::NodeBuilder) -> p2panda::NodeBuilder,
    ) -> Result<(), NodeBuilderError> {
        let mut guard = self.0.lock().map_err(|_| NodeBuilderError::MutexPoisoned)?;
        let builder = guard.take().ok_or(NodeBuilderError::AlreadyConsumed)?;
        *guard = Some(update_fn(builder));
        Ok(())
    }

    fn take(&self) -> Result<p2panda::NodeBuilder, NodeBuilderError> {
        let mut guard = self.0.lock().map_err(|_| NodeBuilderError::MutexPoisoned)?;
        let builder = guard.take().ok_or(NodeBuilderError::AlreadyConsumed)?;
        Ok(builder)
    }
}

#[uniffi::export]
impl NodeBuilder {
    /// Returns the builder for a `Node`.
    #[uniffi::constructor]
    #[allow(clippy::new_without_default)]
    pub fn new() -> Self {
        let inner = p2panda::Node::builder();
        Self(Mutex::new(Some(inner)))
    }

    /// Sets the signing key.
    ///
    /// The public key derived from the given private key is used to identify the node in the
    /// network. For example, this key can be used to directly connect to the node. The private key
    /// serves as the means of authenticating the node during the connection handshake (using TLS
    /// 1.3) and is also used to sign operations to ensure data integrity and authenticity.
    ///
    /// If left unset, a new key will be randomly generated.
    pub fn signing_key(&self, signing_key: Arc<SigningKey>) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.signing_key(signing_key.to_inner()))
    }

    /// Defines the database URL to be used by the store.
    ///
    /// The given URL must take the form of a SQLite database URI: <https://sqlite.org/uri.html>.
    ///
    /// Database migrations are run automatically. Users should use `NodeBuilder::database_pool()`
    /// together with `sqlx` if manual migration management is required.
    ///
    /// If left unset, the node will default to using an ephemeral in-memory database.
    pub fn database_url(&self, url: &str) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.database_url(url))
    }

    /// Defines the acknowledgement policy.
    ///
    /// If left unset, the policy defaults to `Automatic` and all messages emitted from topic
    /// streams will be automatically acknowledged.
    ///
    /// See the `Node::stream(topic)` documentation for further information.
    pub fn ack_policy(&self, ack_policy: AckPolicy) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.ack_policy(ack_policy.into()))
    }

    /// Sets the network identifier.
    ///
    /// The network identifier is used to achieve separation and prevent interoperability between
    /// distinct networks. This is the most global identifier to group nodes into networks. Different
    /// applications may choose to share the same underlying network infrastructure by using the same
    /// network identifier.
    ///
    /// **WARNING:** The network identifier is _not_ confidentially exchanged with a remote node and
    /// can not be treated as a secret value. See: <https://github.com/p2panda/p2panda/issues/965>
    ///
    /// If left unset, the network ID defaults to the byte representation of the BLAKE3 hash of the
    /// string "p2panda".
    pub fn network_id(&self, network_id: Arc<NetworkId>) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.network_id(network_id.to_inner()))
    }

    /// Sets a relay server URL to assist in establishing direct connections.
    ///
    /// Multipe relays can be added; a single "home relay" will be automatically selected based on
    /// latency.
    ///
    /// Relays fullfil multiple functions:
    ///
    /// 1. The relay server helps establish connections by temporarily routing encrypted traffic
    ///    until a direct, P2P connection is feasible. This allows nodes to immediately get
    ///    started, without waiting for holepunching / STUN to complete first.
    /// 2. Handle learning a node's public addresses (via QUIC address discovery), signalling and
    ///    hole-punching to establish direct connections between two nodes. This set of methods is
    ///    also understood as STUN. After this point the relay is not required anymore.
    /// 3. Relayed and encrypted fallback using the server when establishing a direct connection
    ///    failed (TURN).
    ///
    /// If no relay is given other nodes can only connect to us if a directly-reachable IP address
    /// is available and known to them.
    pub fn relay_url(&self, url: Arc<RelayUrl>) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.relay_url(url.to_inner()))
    }

    /// Inserts a bootstrap node into the local address book.
    ///
    /// Bootstrap nodes are used as a starting point for the random-walk discovery algorithm to
    /// find other nodes in the network, without the need for any centralised registry. Any node
    /// can serve as a bootstrap into the network. The URL of the relay used by the bootstrap node
    /// is required to assist with connectivity (via relaying of traffic and negotiation of
    /// hole-punching for direct connections).
    ///
    /// Multiple bootstrap nodes can be registered. Each iteration of the discovery algorithm
    /// begins by picking a random node from the set of known bootstrap nodes. It's recommended to
    /// register several bootstrap nodes, especially if they are not highly-available; this
    /// offers redunancy in the case that any of the bootstrap nodes go offline or are otherwise
    /// unavailable.
    ///
    /// Consult the documentation of the `p2panda-discovery` crate for further details concerning
    /// the discovery protocol.
    pub fn bootstrap(
        &self,
        node_id: Arc<VerifyingKey>,
        relay_url: Arc<RelayUrl>,
    ) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.bootstrap(node_id.to_inner(), relay_url.to_inner()))
    }

    /// Sets the mDNS discovery mode.
    ///
    /// mDNS may be set to active, passive or disabled mode.
    ///
    /// If left unset, the mode defaults to active and this node will actively advertise it's
    /// endpoint address on the local area network.
    pub fn mdns_mode(&self, mode: MdnsDiscoveryMode) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.mdns_mode(mode.into()))
    }

    /// Binds an IPv4 socket at the given address.
    ///
    /// If left unset, the address defaults to `0.0.0.0`.
    pub fn bind_ip_v4(&self, ip_address: &str) -> Result<(), NodeBuilderError> {
        let ip_address = std::net::Ipv4Addr::from_str(ip_address)
            .map_err(|err| IpAddrError::ParseInvalidAddr(err.to_string()))?;
        self.update(|builder| builder.bind_ip_v4(ip_address))
    }

    /// Sets the IPv4 address port.
    ///
    /// If left unset, the port defaults to `0` which results in a random free port being chosen.
    /// If the given port is already in use, a random port will be chosen as a fallback.
    pub fn bind_port_v4(&self, port: u16) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.bind_port_v4(port))
    }

    /// Binds an IPv6 socket at the given address.
    ///
    /// If left unset, the address defaults to `[::]`.
    pub fn bind_ip_v6(&self, ip_address: &str) -> Result<(), NodeBuilderError> {
        let ip_address = std::net::Ipv6Addr::from_str(ip_address)
            .map_err(|err| IpAddrError::ParseInvalidAddr(err.to_string()))?;
        self.update(|builder| builder.bind_ip_v6(ip_address))
    }

    /// Sets the IPv6 address port.
    ///
    /// If left unset, the port defaults to `0` which results in a random free port being chosen.
    /// If the given port is already in use, a random port will be chosen as a fallback.
    pub fn bind_port_v6(&self, port: u16) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.bind_port_v6(port))
    }
}

#[uniffi::export(async_runtime = "tokio")]
impl NodeBuilder {
    /// Spawns the `Node`.
    pub async fn spawn(&self) -> Result<Node, SpawnError> {
        let builder = self.take()?;
        let inner = builder.spawn().await?;
        Ok(inner.into())
    }
}
