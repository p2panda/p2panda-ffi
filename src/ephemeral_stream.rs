// SPDX-License-Identifier: MIT OR Apache-2.0

use std::sync::Arc;

use futures_util::StreamExt;
use thiserror::Error;
use tokio::task::JoinHandle;

use crate::core::{PublicKey, TopicId};
use crate::node::EphemeralStreamCallback;

#[derive(uniffi::Object)]
pub struct EphemeralStream {
    tx: p2panda::streams::EphemeralStreamPublisher<Vec<u8>>,
    task_handle: JoinHandle<()>,
}

impl EphemeralStream {
    pub(crate) fn new(
        tx: p2panda::streams::EphemeralStreamPublisher<Vec<u8>>,
        mut rx: p2panda::streams::EphemeralStreamSubscription<Vec<u8>>,
        callback: Arc<dyn EphemeralStreamCallback>,
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
        self.tx.topic().into()
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
