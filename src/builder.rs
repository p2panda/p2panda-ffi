// SPDX-License-Identifier: MIT OR Apache-2.0

use std::str::FromStr;
use std::sync::{Arc, Mutex};

use thiserror::Error;

use crate::core::{NetworkId, PrivateKey, PublicKey, RelayUrl};
use crate::node::{Node, SpawnError};

#[derive(uniffi::Enum)]
pub enum AckPolicy {
    Explicit,
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

#[derive(uniffi::Enum)]
pub enum MdnsDiscoveryMode {
    Disabled,
    Passive,
    Active,
}

impl From<MdnsDiscoveryMode> for p2panda::network::MdnsDiscoveryMode {
    fn from(value: MdnsDiscoveryMode) -> Self {
        match value {
            MdnsDiscoveryMode::Disabled => Self::Disabled,
            MdnsDiscoveryMode::Passive => Self::Passive,
            MdnsDiscoveryMode::Active => Self::Active,
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
    #[uniffi::constructor]
    #[allow(clippy::new_without_default)]
    pub fn new() -> Self {
        let inner = p2panda::Node::builder();
        Self(Mutex::new(Some(inner)))
    }

    pub fn private_key(&self, private_key: Arc<PrivateKey>) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.private_key(private_key.to_inner()))
    }

    pub fn database_url(&self, url: &str) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.database_url(url))
    }

    pub fn ack_policy(&self, ack_policy: AckPolicy) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.ack_policy(ack_policy.into()))
    }

    pub fn network_id(&self, network_id: Arc<NetworkId>) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.network_id(network_id.to_inner()))
    }

    pub fn relay_url(&self, url: Arc<RelayUrl>) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.relay_url(url.to_inner()))
    }

    pub fn bootstrap(
        &self,
        node_id: Arc<PublicKey>,
        relay_url: Arc<RelayUrl>,
    ) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.bootstrap(node_id.to_inner(), relay_url.to_inner()))
    }

    pub fn mdns_mode(&self, mode: MdnsDiscoveryMode) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.mdns_mode(mode.into()))
    }

    pub fn bind_ip_v4(&self, ip_address: &str) -> Result<(), NodeBuilderError> {
        let ip_address = std::net::Ipv4Addr::from_str(ip_address)
            .map_err(|err| IpAddrError::ParseInvalidAddr(err.to_string()))?;
        self.update(|builder| builder.bind_ip_v4(ip_address))
    }

    pub fn bind_port_v4(&self, port: u16) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.bind_port_v4(port))
    }

    pub fn bind_ip_v6(&self, ip_address: &str) -> Result<(), NodeBuilderError> {
        let ip_address = std::net::Ipv6Addr::from_str(ip_address)
            .map_err(|err| IpAddrError::ParseInvalidAddr(err.to_string()))?;
        self.update(|builder| builder.bind_ip_v6(ip_address))
    }

    pub fn bind_port_v6(&self, port: u16) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.bind_port_v6(port))
    }
}

#[uniffi::export(async_runtime = "tokio")]
impl NodeBuilder {
    pub async fn spawn(&self) -> Result<Node, SpawnError> {
        let builder = self.take()?;
        let inner = builder.spawn().await?;
        Ok(inner.into())
    }
}
