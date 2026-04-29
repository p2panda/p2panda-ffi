// SPDX-License-Identifier: MIT OR Apache-2.0

use std::str::FromStr;
use std::sync::{Arc, Mutex};

use futures_util::StreamExt;
use thiserror::Error;
use tokio::sync::{mpsc, oneshot};
use tokio::task::JoinHandle;

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

impl From<p2panda_core::Topic> for ByteString {
    fn from(value: p2panda_core::Topic) -> Self {
        Self(value)
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

impl From<p2panda_core::Topic> for TopicId {
    fn from(value: p2panda_core::Topic) -> Self {
        Self(ByteString::from(value))
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

impl From<p2panda_core::PublicKey> for PublicKey {
    fn from(value: p2panda_core::PublicKey) -> Self {
        Self(value)
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

impl From<p2panda_core::Hash> for Hash {
    fn from(value: p2panda_core::Hash) -> Self {
        Self(value)
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

    pub async fn stream(
        &self,
        topic: Arc<TopicId>,
        on_event: Arc<dyn OnStreamEvent>,
    ) -> Result<TopicStream, CreateStreamError> {
        let (tx, rx) = self.0.stream::<Vec<u8>>(topic.0.0).await?;
        Ok(TopicStream::new(tx, rx, on_event))
    }

    pub async fn ephemeral_stream(
        &self,
        topic: Arc<TopicId>,
        on_message: Arc<dyn OnEphemeralMessage>,
    ) -> Result<EphemeralStream, CreateStreamError> {
        let (tx, rx) = self.0.ephemeral_stream::<Vec<u8>>(topic.0.0).await?;
        Ok(EphemeralStream::new(tx, rx, on_message))
    }
}

#[derive(Debug, Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum CreateStreamError {
    #[error(transparent)]
    CreateStream(#[from] p2panda::node::CreateStreamError),
}

#[uniffi::export(with_foreign)]
pub trait OnStreamEvent: Send + Sync {
    fn on_event(&self, event: Arc<StreamEvent>);
}

#[uniffi::export(with_foreign)]
pub trait OnEphemeralMessage: Send + Sync {
    fn on_message(&self, message: Arc<EphemeralMessage>);
}

#[derive(uniffi::Object)]
pub struct TopicStream {
    tx: p2panda::streams::StreamPublisher<Vec<u8>>,
    ack_tx: mpsc::Sender<(
        p2panda_core::Hash,
        oneshot::Sender<Result<(), p2panda::streams::AckedError>>,
    )>,
    task_handle: JoinHandle<()>,
}

impl TopicStream {
    fn new(
        tx: p2panda::streams::StreamPublisher<Vec<u8>>,
        mut rx: p2panda::streams::StreamSubscription<Vec<u8>>,
        callback: Arc<dyn OnStreamEvent>,
    ) -> Self {
        let (ack_tx, mut ack_rx) = mpsc::channel::<(
            p2panda_core::Hash,
            oneshot::Sender<Result<(), p2panda::streams::AckedError>>,
        )>(16);

        // Start an internal task which manages the subscription object. We can call it from the
        // exported API via an internal mpsc channel.
        let task_handle = tokio::task::spawn(async move {
            loop {
                tokio::select! {
                    biased;
                    Some((hash, result_tx)) = ack_rx.recv() => {
                        let result = rx.ack(hash).await;
                        let _ = result_tx.send(result);
                    }
                    Some(event) = rx.next() => {
                        callback.on_event(Arc::new(event.into()));
                    }
                }
            }
        });

        Self {
            tx,
            ack_tx,
            task_handle,
        }
    }
}

impl Drop for TopicStream {
    fn drop(&mut self) {
        self.task_handle.abort();
    }
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

    pub async fn ack(&self, message_id: Arc<Hash>) -> Result<(), AckedError> {
        let (result_tx, result_rx) = oneshot::channel();
        self.ack_tx
            .send((message_id.0, result_tx))
            .await
            .expect("internal task runs until whole type was dropped");
        result_rx
            .await
            .expect("internal task runs until whole type was dropped")?;
        Ok(())
    }
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

#[derive(uniffi::Object)]
pub enum Source {}

#[derive(uniffi::Object)]
pub enum StreamEvent {
    Processed { operation: ProcessedOperation },
    SyncStarted,
    SyncEnded,
    Error,
}

impl From<p2panda::streams::StreamEvent<Vec<u8>>> for StreamEvent {
    fn from(event: p2panda::streams::StreamEvent<Vec<u8>>) -> Self {
        match event {
            p2panda::streams::StreamEvent::Processed { operation, .. } => Self::Processed {
                operation: ProcessedOperation(operation),
            },
            p2panda::streams::StreamEvent::SyncStarted { .. } => Self::SyncStarted,
            p2panda::streams::StreamEvent::SyncEnded { .. } => Self::SyncEnded,
            p2panda::streams::StreamEvent::ProcessingFailed { .. } => Self::Error,
            p2panda::streams::StreamEvent::DecodeFailed { .. } => Self::Error,
            p2panda::streams::StreamEvent::ReplayFailed { .. } => Self::Error,
            p2panda::streams::StreamEvent::AckFailed { .. } => Self::Error,
        }
    }
}

#[derive(uniffi::Object)]
pub struct ProcessedOperation(p2panda::streams::ProcessedOperation<Vec<u8>>);

#[uniffi::export]
impl ProcessedOperation {
    pub fn topic(&self) -> TopicId {
        self.0.topic().into()
    }

    pub fn id(&self) -> Hash {
        self.0.id().into()
    }

    pub fn author(&self) -> PublicKey {
        self.0.author().into()
    }

    pub fn timestamp(&self) -> u64 {
        self.0.timestamp()
    }

    pub fn message(&self) -> Vec<u8> {
        self.0.message().clone()
    }
}

#[uniffi::export(async_runtime = "tokio")]
impl ProcessedOperation {
    pub async fn ack(&self) -> Result<(), AckedError> {
        self.0.ack().await?;
        Ok(())
    }
}

#[derive(uniffi::Object)]
pub struct EphemeralStream {
    tx: p2panda::streams::EphemeralStreamPublisher<Vec<u8>>,
    task_handle: JoinHandle<()>,
}

impl EphemeralStream {
    fn new(
        tx: p2panda::streams::EphemeralStreamPublisher<Vec<u8>>,
        mut rx: p2panda::streams::EphemeralStreamSubscription<Vec<u8>>,
        callback: Arc<dyn OnEphemeralMessage>,
    ) -> Self {
        let task_handle = tokio::spawn(async move {
            while let Some(message) = rx.next().await {
                callback.on_message(Arc::new(message.into()));
            }
        });

        Self { tx, task_handle }
    }
}

impl Drop for EphemeralStream {
    fn drop(&mut self) {
        self.task_handle.abort();
    }
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
pub struct EphemeralMessage(p2panda::streams::EphemeralMessage<Vec<u8>>);

#[uniffi::export]
impl EphemeralMessage {
    pub fn topic(&self) -> TopicId {
        self.0.topic().into()
    }

    pub fn author(&self) -> PublicKey {
        self.0.author().into()
    }

    pub fn timestamp(&self) -> u64 {
        self.0.timestamp()
    }

    pub fn body(&self) -> Vec<u8> {
        self.0.body().clone()
    }
}

impl From<p2panda::streams::EphemeralMessage<Vec<u8>>> for EphemeralMessage {
    fn from(value: p2panda::streams::EphemeralMessage<Vec<u8>>) -> Self {
        Self(value)
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
