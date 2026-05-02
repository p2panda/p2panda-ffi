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
        Ok(Self(topic))
    }

    pub fn from_hash(hash: Arc<Hash>) -> Self {
        Self(hash.0.into())
    }

    pub fn from_hex(value: &str) -> Result<Self, ConversionError> {
        let topic = p2panda_core::Topic::from_str(value)?;
        Ok(Self(topic))
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

    /// Invalid iroh Relay URL.
    #[error("invalid iroh relay url: {0}")]
    ParseRelayUrl(String),
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

#[derive(Debug, uniffi::Object)]
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
pub struct RelayUrl(p2panda::node::RelayUrl);

#[uniffi::export]
impl RelayUrl {
    #[uniffi::constructor]
    #[allow(clippy::should_implement_trait)]
    pub fn from_str(value: &str) -> Result<Self, ConversionError> {
        Ok(Self(p2panda::node::RelayUrl::from_str(value).map_err(
            |err| ConversionError::ParseRelayUrl(err.to_string()),
        )?))
    }

    pub fn to_str(&self) -> String {
        self.0.to_string()
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
        callback: Arc<dyn StreamCallback>,
    ) -> Result<TopicStream, CreateStreamError> {
        let (tx, rx) = self.0.stream::<Vec<u8>>(topic.0.0).await?;
        Ok(TopicStream::new(tx, rx, callback))
    }

    pub async fn ephemeral_stream(
        &self,
        topic: Arc<TopicId>,
        on_message: Arc<dyn EphemeralCallback>,
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
pub trait StreamCallback: Send + Sync {
    fn on_sync_event(&self, event: SyncEvent);
    fn on_error(&self, error: StreamError);
    fn on_operation(&self, processed: Arc<ProcessedOperation>, source: Source);
}

#[derive(uniffi::Object)]
pub struct Header(p2panda::operation::Header);

#[uniffi::export]
impl Header {
    pub fn version(&self) -> u64 {
        self.0.version
    }

    pub fn public_key(&self) -> Arc<PublicKey> {
        Arc::new(self.0.public_key.into())
    }

    pub fn timestamp(&self) -> u64 {
        self.0.timestamp.into()
    }

    pub fn payload_size(&self) -> u64 {
        self.0.payload_size
    }

    pub fn payload_hash(&self) -> Arc<Hash> {
        Arc::new(self.0.hash().into())
    }

    pub fn seq_num(&self) -> u64 {
        self.0.seq_num
    }

    pub fn backlink(&self) -> Option<Arc<Hash>> {
        self.0.backlink.map(|hash| Arc::new(hash.into()))
    }

    pub fn prune_flag(&self) -> bool {
        self.0.extensions.prune_flag.is_set()
    }

    pub fn log_id(&self) -> Vec<u8> {
        self.0.extensions.log_id.as_bytes().to_vec()
    }
}

impl From<&p2panda::operation::Header> for Header {
    fn from(value: &p2panda::operation::Header) -> Self {
        Self(value.clone())
    }
}

#[derive(uniffi::Object)]
pub struct Event(
    p2panda::processor::Event<
        p2panda::operation::LogId,
        p2panda::operation::Extensions,
        p2panda_core::topic::Topic,
    >,
);

#[uniffi::export]
impl Event {
    pub fn header(&self) -> Header {
        self.0.header().into()
    }

    pub fn body(&self) -> Option<Vec<u8>> {
        self.0.body().map(|body| body.to_bytes())
    }

    pub fn is_completed(&self) -> bool {
        self.0.is_completed()
    }

    pub fn is_failed(&self) -> bool {
        self.0.is_failed()
    }
}

impl
    From<
        p2panda::processor::Event<
            p2panda::operation::LogId,
            p2panda::operation::Extensions,
            p2panda_core::topic::Topic,
        >,
    > for Event
{
    fn from(
        value: p2panda::processor::Event<
            p2panda::operation::LogId,
            p2panda::operation::Extensions,
            p2panda_core::topic::Topic,
        >,
    ) -> Self {
        Self(value)
    }
}

impl std::fmt::Debug for Event {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_tuple("Event").field(&self.0).finish()
    }
}

#[derive(Debug, uniffi::Enum)]
pub enum SessionPhase {
    Sync,
    Live,
}

impl From<p2panda::streams::SessionPhase> for SessionPhase {
    fn from(value: p2panda::streams::SessionPhase) -> Self {
        match value {
            p2panda::streams::SessionPhase::Sync => Self::Sync,
            p2panda::streams::SessionPhase::Live => Self::Live,
        }
    }
}

#[derive(Debug, uniffi::Enum)]
pub enum Source {
    SyncSession {
        /// Id of the remote sending node.
        remote_node_id: Arc<PublicKey>,

        /// Id of the sync session.
        session_id: u64,

        /// Operation sent during this session.
        sent_operations: u64,

        /// Operations received during this session.
        received_operations: u64,

        /// Bytes sent during this session.
        sent_bytes: u64,

        /// Bytes received during this session.
        received_bytes: u64,

        /// Total bytes sent for this topic across all sessions.
        sent_bytes_topic_total: u64,

        /// Total bytes received for this topic across all sessions.
        received_bytes_topic_total: u64,

        /// The session phase during which an operation arrived.
        phase: SessionPhase,
    },
    LocalStore,
}

impl From<p2panda::streams::Source> for Source {
    fn from(value: p2panda::streams::Source) -> Self {
        match value {
            p2panda::streams::Source::SyncSession {
                remote_node_id,
                session_id,
                sent_operations,
                received_operations,
                sent_bytes,
                received_bytes,
                sent_bytes_topic_total,
                received_bytes_topic_total,
                phase,
            } => Self::SyncSession {
                remote_node_id: Arc::new(remote_node_id.into()),
                session_id,
                sent_operations,
                received_operations,
                sent_bytes,
                received_bytes,
                sent_bytes_topic_total,
                received_bytes_topic_total,
                phase: phase.into(),
            },
            p2panda::streams::Source::LocalStore => Self::LocalStore,
        }
    }
}

#[derive(uniffi::Enum)]
pub enum SyncEvent {
    Started {
        /// Id of the remote sending node.
        remote_node_id: Arc<PublicKey>,

        /// Id of the sync session.
        session_id: u64,

        /// Total operations which will be received during this session.
        incoming_operations: u64,

        /// Total operations which will be sent during this session.
        outgoing_operations: u64,

        /// Total bytes which will be received during this session.
        incoming_bytes: u64,

        /// Total bytes which will be sent during this session.
        outgoing_bytes: u64,

        /// Total sessions currently running over the same topic.
        topic_sessions: u64,
    },
    Ended {
        /// Id of the remote sending node.
        remote_node_id: Arc<PublicKey>,

        /// Id of the sync session.
        session_id: u64,

        /// Operation sent during this session.
        sent_operations: u64,

        /// Operations received during this session.
        received_operations: u64,

        /// Bytes sent during this session.
        sent_bytes: u64,

        /// Bytes received during this session.
        received_bytes: u64,

        /// Total bytes sent for this topic across all sessions.
        sent_bytes_topic_total: u64,

        /// Total bytes received for this topic across all sessions.
        received_bytes_topic_total: u64,

        /// If the sync session ended with an error the reason is included here.
        error: Option<SyncError>,
    },
}

#[derive(Debug, Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum SyncError {
    #[error(transparent)]
    SyncError(#[from] p2panda::streams::SyncError),
}

#[derive(Debug, Error, uniffi::Error)]
pub enum StreamError {
    #[error("processing operation failed: {error}")]
    ProcessingFailed { event: Arc<Event>, error: String },

    #[error("decoding message payload failed: {error}")]
    DecodeFailed { event: Arc<Event>, error: String },

    #[error("replaying events failed: {error}")]
    ReplayFailed { error: String },

    #[error("acking event failed: {error}")]
    AckFailed { event: Arc<Event>, error: String },
}

#[uniffi::export(with_foreign)]
pub trait EphemeralCallback: Send + Sync {
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
        callback: Arc<dyn StreamCallback>,
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
                        match event {
                            p2panda::streams::StreamEvent::Processed { operation, source } => {
                                callback.on_operation(Arc::new(ProcessedOperation(operation)), source.into());
                            },
                            p2panda::streams::StreamEvent::SyncStarted {
                                remote_node_id,
                                session_id,
                                incoming_operations,
                                outgoing_operations,
                                incoming_bytes,
                                outgoing_bytes,
                                topic_sessions,
                            } => {
                                callback.on_sync_event(SyncEvent::Started {
                                    remote_node_id: Arc::new(remote_node_id.into()),
                                    session_id,
                                    incoming_operations,
                                    outgoing_operations,
                                    incoming_bytes,
                                    outgoing_bytes,
                                    topic_sessions,
                                });
                            },
                            p2panda::streams::StreamEvent::SyncEnded {
                                remote_node_id,
                                session_id,
                                sent_operations,
                                received_operations,
                                sent_bytes,
                                received_bytes,
                                sent_bytes_topic_total,
                                received_bytes_topic_total,
                                error
                            } => {
                                callback.on_sync_event(SyncEvent::Ended {
                                    remote_node_id: Arc::new(remote_node_id.into()),
                                    session_id,
                                    sent_operations,
                                    received_operations,
                                    sent_bytes,
                                    received_bytes,
                                    sent_bytes_topic_total,
                                    received_bytes_topic_total,
                                    error: error.map(|error| error.into()),
                                });
                            }
                            p2panda::streams::StreamEvent::ProcessingFailed { event, error, .. } => {
                                callback.on_error(StreamError::ProcessingFailed {
                                    event: Arc::new(event.into()),
                                    error: error.to_string(),
                                });
                            },
                            p2panda::streams::StreamEvent::DecodeFailed { event, error } => {
                                callback.on_error(StreamError::DecodeFailed {
                                    event: Arc::new(event.into()),
                                    error: error.to_string(),
                                });
                            },
                            p2panda::streams::StreamEvent::ReplayFailed { error } => {
                                callback.on_error(StreamError::ReplayFailed {
                                    error: error.to_string(),
                                });
                            },
                            p2panda::streams::StreamEvent::AckFailed { event, error } => {
                                callback.on_error(StreamError::AckFailed {
                                    event: Arc::new(event.into()),
                                    error: error.to_string(),
                                });
                            },
                        }
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

    pub fn processed(&self) -> Event {
        Event(self.0.processed().clone())
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
        callback: Arc<dyn EphemeralCallback>,
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
    #[allow(clippy::new_without_default)]
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

    pub fn ack_policy(&self, ack_policy: AckPolicy) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.ack_policy(ack_policy.into()))
    }

    pub fn network_id(&self, network_id: Arc<NetworkId>) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.network_id((&network_id.0).into()))
    }

    pub fn relay_url(&self, url: Arc<RelayUrl>) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.relay_url(url.0.clone()))
    }

    pub fn bootstrap(
        &self,
        node_id: Arc<PublicKey>,
        relay_url: Arc<RelayUrl>,
    ) -> Result<(), NodeBuilderError> {
        self.update(|builder| builder.bootstrap(node_id.0, relay_url.0.clone()))
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

impl From<MdnsDiscoveryMode> for p2panda::node::MdnsDiscoveryMode {
    fn from(value: MdnsDiscoveryMode) -> Self {
        match value {
            MdnsDiscoveryMode::Disabled => unimplemented!("not yet supported"),
            MdnsDiscoveryMode::Passive => Self::Passive,
            MdnsDiscoveryMode::Active => Self::Active,
        }
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
