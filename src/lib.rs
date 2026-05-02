// SPDX-License-Identifier: MIT OR Apache-2.0

mod builder;
mod core;
mod ephemeral_stream;
mod node;
mod topic_stream;

pub use builder::*;
pub use core::*;
pub use ephemeral_stream::*;
pub use node::*;
pub use topic_stream::*;

// We're only using proc-macros to "scaffold" everything for UniFFI. This means that no explicit UDL
// file is required and everything can be "derived" with Rust macro magic.
uniffi::setup_scaffolding!();
