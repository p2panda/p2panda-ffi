// SPDX-License-Identifier: MIT OR Apache-2.0

use std::sync::Arc;

use thiserror::Error;

use crate::builder::NodeBuilderError;
use crate::core::{Cursor, NetworkId, PublicKey, RelayUrl, TopicId};
use crate::ephemeral_stream::{EphemeralMessage, EphemeralStream};
use crate::topic_stream::{ProcessedOperation, Source, StreamError, StreamEvent, TopicStream};

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

    pub fn network_id(&self) -> NetworkId {
        self.0.network_id().into()
    }

    pub async fn insert_bootstrap(
        &self,
        node_id: Arc<PublicKey>,
        relay_url: Arc<RelayUrl>,
    ) -> Result<(), NetworkError> {
        self.0
            .insert_bootstrap(node_id.to_inner(), relay_url.to_inner())
            .await?;
        Ok(())
    }

    pub async fn stream(
        &self,
        topic: Arc<TopicId>,
        callback: Arc<dyn TopicStreamCallback>,
    ) -> Result<TopicStream, CreateStreamError> {
        let (tx, rx) = self.0.stream::<Vec<u8>>(topic.to_inner()).await?;
        Ok(TopicStream::new(tx, rx, callback))
    }

    pub async fn stream_from(
        &self,
        topic: Arc<TopicId>,
        from: StreamFrom,
        callback: Arc<dyn TopicStreamCallback>,
    ) -> Result<TopicStream, CreateStreamError> {
        let (tx, rx) = self
            .0
            .stream_from::<Vec<u8>>(topic.to_inner(), from.into())
            .await?;
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

#[derive(uniffi::Enum)]
pub enum StreamFrom {
    Start,
    Frontier,
    Cursor(Arc<Cursor>),
}

impl From<StreamFrom> for p2panda::streams::StreamFrom {
    fn from(value: StreamFrom) -> Self {
        match value {
            StreamFrom::Start => Self::Start,
            StreamFrom::Frontier => Self::Frontier,
            StreamFrom::Cursor(cursor) => Self::Cursor(cursor.to_inner()),
        }
    }
}

#[uniffi::export(with_foreign)]
pub trait TopicStreamCallback: Send + Sync {
    fn on_event(&self, event: StreamEvent);
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

#[derive(Debug, Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum NetworkError {
    #[error(transparent)]
    Network(#[from] p2panda::network::NetworkError),
}
