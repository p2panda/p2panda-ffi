// SPDX-License-Identifier: MIT OR Apache-2.0

use std::str::FromStr;
use std::sync::{Arc, Mutex};

use thiserror::Error;

// TODO: Couldn't find a good name for this yet, it's a WORD (32 bytes).
/// Internally used type representing a (random) 32-byte string.
struct ByteString(p2panda::node::Topic);

impl ByteString {
    pub fn random() -> Self {
        Self(p2panda_core::Topic::new())
    }

    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        let topic = p2panda_core::Topic::try_from(value)?;
        Ok(Self(topic.into()))
    }

    pub fn from_hash(hash: Arc<Hash>) -> Self {
        Self(hash.0.into())
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

impl From<p2panda_core::hash::HashError> for ConversionError {
    fn from(err: p2panda_core::hash::HashError) -> Self {
        match err {
            p2panda_core::hash::HashError::InvalidLength(given, expected) => {
                Self::InvalidLength(given, expected)
            }
            p2panda_core::hash::HashError::InvalidHexEncoding(inner) => {
                Self::InvalidHexEncoding(inner.to_string())
            }
        }
    }
}

impl From<p2panda_core::identity::IdentityError> for ConversionError {
    fn from(err: p2panda_core::identity::IdentityError) -> Self {
        match err {
            p2panda_core::identity::IdentityError::InvalidLength(given, expected) => {
                Self::InvalidLength(given, expected)
            }
            p2panda_core::identity::IdentityError::InvalidHexEncoding(inner) => {
                Self::InvalidHexEncoding(inner.to_string())
            }
            p2panda_core::IdentityError::InvalidSignature(_) => {
                unreachable!("we're currently not exporting signing")
            }
        }
    }
}

#[derive(uniffi::Object)]
pub struct NetworkId(ByteString);

#[uniffi::export]
impl NetworkId {
    #[uniffi::constructor]
    pub fn random() -> Self {
        Self(ByteString::random())
    }

    #[uniffi::constructor]
    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        Ok(Self(ByteString::from_bytes(value)?))
    }

    #[uniffi::constructor]
    pub fn from_hash(hash: Arc<Hash>) -> Self {
        Self(ByteString::from_hash(hash))
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
    pub fn random() -> Self {
        Self(ByteString::random())
    }

    #[uniffi::constructor]
    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        Ok(Self(ByteString::from_bytes(value)?))
    }

    #[uniffi::constructor]
    pub fn from_hash(hash: Arc<Hash>) -> Self {
        Self(ByteString::from_hash(hash))
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
    #[uniffi::constructor]
    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        Ok(Self(p2panda_core::PublicKey::try_from(value)?))
    }

    #[uniffi::constructor]
    pub fn from_hex(value: &str) -> Result<Self, ConversionError> {
        Ok(Self(p2panda_core::PublicKey::from_str(value)?))
    }

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
    pub fn generate() -> Self {
        Self(p2panda_core::PrivateKey::new())
    }

    #[uniffi::constructor]
    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        Ok(Self(p2panda_core::PrivateKey::try_from(value)?))
    }

    #[uniffi::constructor]
    pub fn from_hex(value: &str) -> Result<Self, ConversionError> {
        let bytes = ByteString::from_hex(value)?.to_bytes();
        Ok(Self(p2panda_core::PrivateKey::try_from(&bytes[..])?))
    }

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
    #[uniffi::constructor]
    pub fn digest(value: &[u8]) -> Self {
        Self(p2panda_core::Hash::new(value))
    }

    #[uniffi::constructor]
    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        Ok(Self(p2panda_core::Hash::try_from(value)?))
    }

    #[uniffi::constructor]
    pub fn from_hex(value: &str) -> Result<Self, ConversionError> {
        Ok(Self(p2panda_core::Hash::from_str(value)?))
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.as_bytes().to_vec()
    }

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

    pub async fn stream(&self, topic: Arc<TopicId>) -> Result<TopicStream, CreateStreamError> {
        let (tx, rx) = self.0.stream::<Vec<u8>>(topic.0.0).await?;
        Ok(TopicStream { tx, rx })
    }

    pub async fn ephemeral_stream(
        &self,
        topic: Arc<TopicId>,
    ) -> Result<EphemeralStream, CreateStreamError> {
        let (tx, rx) = self.0.ephemeral_stream::<Vec<u8>>(topic.0.0).await?;
        Ok(EphemeralStream { tx, rx })
    }
}

#[derive(Debug, Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum CreateStreamError {
    #[error(transparent)]
    CreateStream(#[from] p2panda::node::CreateStreamError),
}

#[derive(uniffi::Object)]
pub struct TopicStream {
    tx: p2panda::streams::StreamPublisher<Vec<u8>>,
    rx: p2panda::streams::StreamSubscription<Vec<u8>>,
}

#[uniffi::export(async_runtime = "tokio")]
impl TopicStream {
    pub fn topic(&self) -> TopicId {
        TopicId(ByteString(self.tx.topic()))
    }

    pub async fn publish(&self, message: Vec<u8>) -> Result<Hash, PublishError> {
        let processing = self.tx.publish(message).await?;
        let message_id = processing.hash();
        let _ = processing.await;
        Ok(Hash(message_id))
    }

    pub async fn prune(&self, message: Option<Vec<u8>>) -> Result<Hash, PublishError> {
        let processing = self.tx.prune(message).await?;
        let message_id = processing.hash();
        let _ = processing.await;
        Ok(Hash(message_id))
    }

    // TODO: Probably we'll pass in an on_message callback in the constructor instead when creating
    // the stream.
    #[allow(unused)]
    pub async fn subscribe(&self, on_message: Arc<dyn OnMessage>) {
        // TODO: This needs spawning a task where we call on_message whenever a message arrives on
        // the subscriber stream. The subscriber itself is not clonable so probably we want to use
        // a channel instead to ack as well.
    }

    pub async fn ack(&self, message_id: Arc<Hash>) -> Result<(), AckedError> {
        self.rx.ack(message_id.0).await?;
        Ok(())
    }
}

#[uniffi::export(with_foreign)]
pub trait OnMessage: Send + Sync {
    // TODO: Correct message type with different events, etc.
    fn on_message(&self, message: Vec<u8>);
}

// TODO: Not sure if this approach of dedicated error types makes sense, maybe one large error type
// with all the variants is sufficient for most languages?
#[derive(Debug, Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum PublishError {
    #[error(transparent)]
    PublishError(#[from] p2panda::streams::PublishError),
}

#[derive(Debug, Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum AckedError {
    #[error(transparent)]
    AckedError(#[from] p2panda::streams::AckedError),
}

#[allow(unused)]
#[derive(uniffi::Object)]
pub struct EphemeralStream {
    tx: p2panda::streams::EphemeralStreamPublisher<Vec<u8>>,
    rx: p2panda::streams::EphemeralStreamSubscription<Vec<u8>>,
}

#[uniffi::export(async_runtime = "tokio")]
impl EphemeralStream {
    pub fn topic(&self) -> TopicId {
        TopicId(ByteString(self.tx.topic()))
    }

    pub async fn publish(&self, message: Vec<u8>) -> Result<(), EphemeralPublishError> {
        self.tx.publish(message).await?;
        Ok(())
    }
}

#[derive(Debug, Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum EphemeralPublishError {
    #[error(transparent)]
    EphemeralPublish(#[from] p2panda::streams::EphemeralPublishError),
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

    // TODO: Add more builder methods.
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
