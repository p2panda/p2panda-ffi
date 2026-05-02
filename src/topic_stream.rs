// SPDX-License-Identifier: MIT OR Apache-2.0

use std::sync::Arc;

use futures_util::StreamExt;
use thiserror::Error;
use tokio::sync::{mpsc, oneshot};
use tokio::task::JoinHandle;

use crate::core::{Hash, Header, PublicKey, TopicId};
use crate::node::TopicStreamCallback;

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
    pub(crate) fn new(
        tx: p2panda::streams::StreamPublisher<Vec<u8>>,
        mut rx: p2panda::streams::StreamSubscription<Vec<u8>>,
        callback: Arc<dyn TopicStreamCallback>,
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
                            p2panda::streams::StreamEvent::Processed {
                                operation,
                                source,
                            } => {
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
        self.tx.topic().into()
    }

    pub async fn publish(&self, message: Vec<u8>) -> Result<Hash, PublishError> {
        let processing = self.tx.publish(message).await?;
        let message_id = processing.hash();
        let _ = processing.await;
        Ok(message_id.into())
    }

    pub async fn prune(&self, message: Option<Vec<u8>>) -> Result<Hash, PublishError> {
        let processing = self.tx.prune(message).await?;
        let message_id = processing.hash();
        let _ = processing.await;
        Ok(message_id.into())
    }

    pub async fn ack(&self, message_id: Arc<Hash>) -> Result<(), AckedError> {
        let (result_tx, result_rx) = oneshot::channel();
        self.ack_tx
            .send((message_id.to_inner(), result_tx))
            .await
            .expect("internal task runs until whole type was dropped");
        result_rx
            .await
            .expect("internal task runs until whole type was dropped")?;
        Ok(())
    }
}

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
#[uniffi(flat_error)]
#[allow(clippy::enum_variant_names)]
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
