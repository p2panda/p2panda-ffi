// SPDX-License-Identifier: MIT OR Apache-2.0

use std::str::FromStr;
use std::sync::{Arc, Mutex};

use thiserror::Error;

/// Internally used type representing a (random) 32-byte string.
struct ByteString(p2panda::node::Topic);

impl ByteString {
    pub fn new() -> Self {
        Self(p2panda_core::Topic::new())
    }

    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        let topic = p2panda_core::Topic::try_from(value)?;
        Ok(Self(topic.into()))
    }

    pub fn from_str(value: &str) -> Self {
        let hash = p2panda_core::hash::Hash::new(value.as_bytes());
        Self(hash.into())
    }

    pub fn from_hex(value: &str) -> Result<Self, ConversionError> {
        let topic = p2panda_core::Topic::from_str(value)?;
        Ok(Self(topic.into()))
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.to_bytes().to_vec()
    }

    pub fn to_hex(&self) -> String {
        self.0.to_string()
    }
}

impl From<&ByteString> for [u8; 32] {
    fn from(value: &ByteString) -> Self {
        value.0.to_bytes()
    }
}

#[derive(Debug, Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum ConversionError {
    /// Invalid number of bytes.
    #[error("invalid bytes length of {0}, expected {1} bytes")]
    InvalidLength(usize, usize),

    /// String contains invalid hexadecimal characters.
    #[error("invalid hex encoding in string: {0}")]
    InvalidHexEncoding(String),
}

impl From<p2panda_core::topic::TopicError> for ConversionError {
    fn from(err: p2panda_core::topic::TopicError) -> Self {
        match err {
            p2panda_core::topic::TopicError::InvalidLength(given, expected) => {
                Self::InvalidLength(given, expected)
            }
            p2panda_core::topic::TopicError::InvalidHexEncoding(inner) => {
                Self::InvalidHexEncoding(inner.to_string())
            }
        }
    }
}

#[derive(uniffi::Object)]
pub struct NetworkId(ByteString);

#[uniffi::export]
impl NetworkId {
    #[uniffi::constructor]
    pub fn new() -> Self {
        Self(ByteString::new())
    }

    #[uniffi::constructor]
    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        Ok(Self(ByteString::from_bytes(value)?))
    }

    #[uniffi::constructor]
    pub fn from_str(value: &str) -> Self {
        Self(ByteString::from_str(value))
    }

    #[uniffi::constructor]
    pub fn from_hex(value: &str) -> Result<Self, ConversionError> {
        Ok(Self(ByteString::from_hex(value)?))
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.to_bytes()
    }

    pub fn to_hex(&self) -> String {
        self.0.to_hex()
    }
}

#[derive(uniffi::Object)]
pub struct TopicId(ByteString);

#[uniffi::export]
impl TopicId {
    #[uniffi::constructor]
    pub fn new() -> Self {
        Self(ByteString::new())
    }

    #[uniffi::constructor]
    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        Ok(Self(ByteString::from_bytes(value)?))
    }

    #[uniffi::constructor]
    pub fn from_str(value: &str) -> Self {
        Self(ByteString::from_str(value))
    }

    #[uniffi::constructor]
    pub fn from_hex(value: &str) -> Result<Self, ConversionError> {
        Ok(Self(ByteString::from_hex(value)?))
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.to_bytes()
    }

    pub fn to_hex(&self) -> String {
        self.0.to_hex()
    }
}

#[derive(uniffi::Object)]
pub struct PublicKey(p2panda_core::PublicKey);

#[uniffi::export]
impl PublicKey {
    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.as_bytes().to_vec()
    }

    pub fn to_hex(&self) -> String {
        self.0.to_hex()
    }
}

#[derive(uniffi::Object)]
pub struct PrivateKey(p2panda_core::PrivateKey);

#[uniffi::export]
impl PrivateKey {
    #[uniffi::constructor]
    pub fn new() -> Self {
        Self(p2panda_core::PrivateKey::new())
    }
}

#[uniffi::export]
impl PrivateKey {
    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.as_bytes().to_vec()
    }

    pub fn to_hex(&self) -> String {
        self.0.to_hex()
    }

    pub fn public_key(&self) -> PublicKey {
        PublicKey(self.0.public_key())
    }
}

#[derive(uniffi::Object)]
pub struct Hash(p2panda_core::Hash);

#[uniffi::export]
impl Hash {
    pub fn to_hex(&self) -> String {
        self.0.to_hex()
    }
}

#[derive(uniffi::Object)]
pub struct Node(p2panda::Node);

#[uniffi::export(async_runtime = "tokio")]
impl Node {
    #[uniffi::constructor]
    pub async fn spawn() -> Result<Self, SpawnError> {
        let inner = p2panda::Node::spawn().await?;
        Ok(Self(inner))
    }

    pub fn id(&self) -> PublicKey {
        PublicKey(self.0.id())
    }
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
    pub fn new() -> Self {
        let inner = p2panda::Node::builder();
        Self(Mutex::new(Some(inner)))
    }

    pub fn private_key(&self, private_key: Arc<PrivateKey>) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.private_key(private_key.0.clone()))
    }

    pub fn database_url(&self, url: &str) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.database_url(url))
    }

    pub fn network_id(&self, network_id: Arc<NetworkId>) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.network_id((&network_id.0).into()))
    }
}

#[uniffi::export(async_runtime = "tokio")]
impl NodeBuilder {
    pub async fn spawn(&self) -> Result<Node, SpawnError> {
        let builder = self.take()?;
        let inner = builder.spawn().await?;
        Ok(Node(inner))
    }
}

#[derive(Debug, Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum NodeBuilderError {
    #[error("builder was already consumed to spawn node, please create a new one")]
    AlreadyConsumed,

    #[error("thread holding the builder mutex panicked")]
    MutexPoisoned,
}

#[derive(Debug, Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum SpawnError {
    #[error(transparent)]
    Spawn(#[from] p2panda::node::SpawnError),

    #[error(transparent)]
    NodeBuilder(#[from] NodeBuilderError),

    #[error(transparent)]
    Rpc(#[from] uniffi::UnexpectedUniFFICallbackError),
}

// We're only using proc-macros to "scaffold" everything for UniFFI. This means that no explicit UDL
// file is required and everything can be "derived" with Rust macro magic.
uniffi::setup_scaffolding!();
