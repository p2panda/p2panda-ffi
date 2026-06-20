// SPDX-License-Identifier: MIT OR Apache-2.0

use std::sync::Arc;

use thiserror::Error;

use crate::builder::NodeBuilderError;
use crate::core::{Cursor, NetworkId, RelayUrl, Topic, VerifyingKey};
use crate::ephemeral_stream::{EphemeralMessage, EphemeralStream};
use crate::topic_stream::{ProcessedOperation, Source, StreamError, StreamEvent, TopicStream};

#[derive(uniffi::Object)]
pub struct Node(p2panda::Node);

#[uniffi::export(async_runtime = "tokio")]
impl Node {
    /// Spawns a `Node` using default configuration parameters.
    #[uniffi::constructor]
    pub async fn spawn() -> Result<Self, SpawnError> {
        let inner = p2panda::Node::spawn().await?;
        Ok(Self(inner))
    }

    /// Returns the node identifier (public key).
    pub fn id(&self) -> VerifyingKey {
        self.0.id().into()
    }

    /// Returns the network identifier being used by the node.
    pub fn network_id(&self) -> NetworkId {
        self.0.network_id().into()
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
    pub async fn insert_bootstrap(
        &self,
        node_id: Arc<VerifyingKey>,
        relay_url: Arc<RelayUrl>,
    ) -> Result<(), NetworkError> {
        self.0
            .insert_bootstrap(node_id.to_inner(), relay_url.to_inner())
            .await?;
        Ok(())
    }

    /// Returns a publisher and stateful subscriber for an eventually consistent event stream of
    /// messages over the given topic.
    ///
    /// This API is inspired by the principles of "event streaming", combined with eventually
    /// consistent "local-first" and causally ordered events.
    ///
    /// ## Event types
    ///
    /// Items emitted from the stream include application messages (delivered on top of p2panda's
    /// "operation" append-only log data-type), error and system events, for example about the sync
    /// session taking place on the networking layer.
    ///
    /// ## Event processing
    ///
    /// Every operation running through the subscription stream gets processed by an internal "event
    /// processing pipeline". This concerns the system-layer, meaning the internal p2panda
    /// append-only log `Operation` data-type and internal processors to derive state from these
    /// operations. Here we check the log-integrity, prune the log on demand, order operations
    /// causally and more.
    ///
    /// After this we're forwarding the message to the application-layer, with a bunch of meta data
    /// and debugging info attached.
    ///
    /// Applications usually want to further process the received events from the stream, for
    /// example validating the application specific message format to then finally change the state.
    ///
    /// These application messages can be deltas of CRDTs (Conflict-Free Replicated Data-Types) or
    /// concrete events, such as "move pawn to E4" in a chess-game. Usually applying these state
    /// transitions will lead to a new "materialization" of the application's state which is
    /// persisted in the app's database.
    ///
    /// This streaming API has a *at least once* guarantee, meaning that events can occur more than
    /// once. Any processing system needs to have an idempotency guarantee or account for tracking
    /// processed events.
    ///
    /// Events are automatically acknowledged by default and re-played when not acked on app-start,
    /// read further below for more details on the stateful design of stream subscribers, cursors
    /// and acknowledgments.
    ///
    /// ```text
    ///               ┌────────────────────────────────────────────┐
    ///               │                                            │   APPLICATION
    ///               │               User interface               │   (example)
    ///               │                                            │
    ///               └───▲────────────────────────────────────┬───┘
    ///                   │                                    ▼
    ///           ┌───────┼───────┐                       User Action
    ///           │               │                            │
    ///           │   Database    │                            │
    ///           │               │                            │
    ///           └───────────▲───┘                            │
    ///                       │                                │
    ///      Acknowledge      │                                │
    ///     ┌─────────┐       │                                │
    ///     │         │       │                                │
    ///     │     ┌───┼───────┼───┐                            │
    ///     │     │               │                            │
    ///     │     │  Application  │                            │
    ///     │     │  Stream       │                            │ Command
    ///     │     │  Processing   │                      ┌─────▼──────┐
    ///     │     │               │                      │Create Event│
    ///     │     │               │                      └─────┬──────┘
    ///     │     └───────▲───────┘                            │
    ///     │             │                                    │
    ///     │             │                                    │
    ///     │             │ rx                                 │ tx
    ///     │             │                                    │
    /// ────┼─────────────┼────────────────────────────────────┼──────────────────
    ///     │             │                                    │            SYSTEM
    ///     │     ┌───────┼───────┐                            │
    ///     │     │               │                            │ Publish
    ///     │     │               │           ┌────────────────▼─────────────────┐
    ///     │     │   System      │           │Create & sign p2panda operation w.│
    ///     │     │   Stream      │           │"message" payload from application│
    ///     │     │   Processing  │           └────────────────┬─────────────────┘
    ///     │     │               │                            │
    /// ┌───▼───┐ │               │                            │
    /// │ Acked │ │               │                            │
    /// │ State │ │               │                            │
    /// └───┬───┘ │               │                            │
    ///     └─────┤               │                            │
    ///           └───────▲───────┘                            │
    ///                   │                                    │
    ///                   │                                    │
    ///                   │◄───────────────────────────────────┤
    ///                   │                                    │
    ///                   │                                    │
    ///                   │ Receive from other nodes           │ Publish
    ///                   │                                    │
    ///               ┌───┼────────────────────────────────────▼──┐
    ///               │                                           │
    ///               │                p2p network                │
    ///               │                                           │
    ///               └───────────────────────────────────────────┘
    /// ```
    ///
    /// Locally created operations (via the stream publisher) are processed by the same pipeline. It
    /// is possible to await the processing result which can be useful for some applications if they
    /// want to block UI components etc.
    ///
    /// ## Stateful subscriptions and acknowledgments
    ///
    /// The returned [`StreamSubscription`] is stateful and keeps track of already acknowledged
    /// operations by persisting them in the local SQLite database. Operations which have not been
    /// acknowledged yet will be automatically re-played when this stream is created again.
    ///
    /// By default all events are automatically acknowledged. Use [`AckPolicy`] to change this
    /// behaviour when configuring the node. It is recommended to switch to a manual policy and
    /// explicitly acknowledge events _after_ processing them on application-layer was successful
    /// (see diagram above). Like this applications can ensure every event is at least processed
    /// once, guaranteeing resiliance in the context of application crashes.
    ///
    /// The topic is used to identify each stream's state. It is not recommended to create more than
    /// one subscription over the same topic using this high-level method as the acked state will be
    /// shared across them, leading to potentially surprising behaviour ("work stealing" processing
    /// behaviour across streams and potentially more duplicate events).
    ///
    /// Applications _never_ acknowledge events which only concern system-level state (for example
    /// pruning events without a payload, key agreement "control messages" etc.), these are _always_
    /// acknowledged automatically after they've been processed successfully, independent of the
    /// chosen ack policy.
    ///
    /// ## Crash Resiliance & Re-plays
    ///
    /// Un-acknowledged ("nacked") events are automatically re-played when a stream is created by
    /// default. This gives us the "at least once" guarantee, making sure no events get lost, even
    /// when facing system crashes or other unexpected exits (for example a user moving a mobile
    /// application into the background, interrupting all current processing).
    ///
    /// With the [`Node::stream_from`] method we can further determine the behaviour of re-plays.
    /// For example we can begin streaming from a custom "cursor" position on or request to stream
    /// _all_ currently known events for this topic from the start. All of these tools allow for
    /// different patterns of application state materialization, rolling out breaking changes,
    /// updates, etc.
    ///
    /// Please note that this can be a destructive action as it will _replace_ and persist the
    /// current acked stream state with the new arguments.
    ///
    /// ## System-level failures
    ///
    /// In most cases application developers will not need to deal with the system-level event
    /// processing part. However, in rare cases (bugs, critical failures, etc.) processing an event,
    /// re-playing or acknowledging it might have failed.
    ///
    /// Usually these situations are connected to system failure (running out of resource like
    /// hard-disc space) or bugs in p2panda. Since failed system-level events are not acknowledged,
    /// they will be automatically replayed when the application starts again. If the underlying
    /// cause of the error was not fixed by that, then you might want to consult if any patches have
    /// been made in p2panda.
    pub async fn stream(
        &self,
        topic: Arc<Topic>,
        callback: Arc<dyn TopicStreamCallback>,
    ) -> Result<TopicStream, CreateStreamError> {
        let (tx, rx) = self.0.stream::<Vec<u8>>(topic.to_inner()).await?;
        Ok(TopicStream::new(tx, rx, callback))
    }

    /// Eventually consistent publish and subscribe stream of messages from a given position.
    ///
    /// Use [`StreamFrom`] to determine the starting position of the subscription stream.
    ///
    /// See [`Node::stream`] for further information.
    pub async fn stream_from(
        &self,
        topic: Arc<Topic>,
        from: StreamFrom,
        callback: Arc<dyn TopicStreamCallback>,
    ) -> Result<TopicStream, CreateStreamError> {
        let (tx, rx) = self
            .0
            .stream_from::<Vec<u8>>(topic.to_inner(), from.into())
            .await?;
        Ok(TopicStream::new(tx, rx, callback))
    }

    /// Returns a publisher and subscriber pair for an ephemeral stream of messages over the given
    /// topic.
    ///
    /// Messages sent or received on this stream will not be persisted in local storage. Only
    /// currently online and reachable nodes will receive published messages.
    ///
    /// Message payloads are signed providing integrity and provenance guarantees, plus making sure
    /// each message is unique with the help of a timestamp.
    pub async fn ephemeral_stream(
        &self,
        topic: Arc<Topic>,
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

/// Determines the starting point of a subscription stream.
#[derive(uniffi::Enum)]
pub enum StreamFrom {
    /// Stream all events from the beginning, including already acknowledged ones.
    ///
    /// `Start` is useful if the application doesn't keep any materialised state around and needs to
    /// repeat all messages from the beginning. Another use-case is the roll-out of an application
    /// update where all state needs to be re-materialised.
    Start,

    /// Stream only unacknowledged events from where we've ended last.
    ///
    /// We keep an internal cursor around for each topic which is used to track acknowledged
    /// operations.
    Frontier,

    /// Stream all events from _after_ the given cursor position.
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
