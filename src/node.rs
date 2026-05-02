// SPDX-License-Identifier: MIT OR Apache-2.0

use std::sync::Arc;

use thiserror::Error;

use crate::builder::NodeBuilderError;
use crate::core::{PublicKey, TopicId};
use crate::ephemeral_stream::{EphemeralMessage, EphemeralStream};
use crate::topic_stream::{ProcessedOperation, Source, StreamError, SyncEvent, TopicStream};

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
        self.0.id().into()
    }

    pub async fn stream(
        &self,
        topic: Arc<TopicId>,
        callback: Arc<dyn TopicStreamCallback>,
    ) -> Result<TopicStream, CreateStreamError> {
        let (tx, rx) = self.0.stream::<Vec<u8>>(topic.to_inner()).await?;
        Ok(TopicStream::new(tx, rx, callback))
    }

    pub async fn ephemeral_stream(
        &self,
        topic: Arc<TopicId>,
        on_message: Arc<dyn EphemeralStreamCallback>,
    ) -> Result<EphemeralStream, CreateStreamError> {
        let (tx, rx) = self.0.ephemeral_stream::<Vec<u8>>(topic.to_inner()).await?;
        Ok(EphemeralStream::new(tx, rx, on_message))
    }
}

impl From<p2panda::Node> for Node {
    fn from(inner: p2panda::Node) -> Self {
        Self(inner)
    }
}

#[uniffi::export(with_foreign)]
pub trait TopicStreamCallback: Send + Sync {
    fn on_sync_event(&self, event: SyncEvent);
    fn on_error(&self, error: StreamError);
    fn on_operation(&self, processed: Arc<ProcessedOperation>, source: Source);
}

#[uniffi::export(with_foreign)]
pub trait EphemeralStreamCallback: Send + Sync {
    fn on_message(&self, message: Arc<EphemeralMessage>);
}

#[derive(Debug, Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum CreateStreamError {
    #[error(transparent)]
    CreateStream(#[from] p2panda::node::CreateStreamError),
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
