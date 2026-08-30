// SPDX-License-Identifier: MIT OR Apache-2.0

use std::str::FromStr;
use std::sync::Arc;

use thiserror::Error;

/// Internally used type representing a (random) 32-byte string.
#[derive(Debug)]
struct ByteString(p2panda_core::Topic);

impl ByteString {
    pub fn random() -> Self {
        Self(p2panda_core::Topic::random())
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

impl NetworkId {
    pub(crate) fn to_inner(&self) -> p2panda::NetworkId {
        (&self.0).into()
    }
}

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

impl From<p2panda::NetworkId> for NetworkId {
    fn from(value: p2panda::NetworkId) -> Self {
        Self(ByteString(value.into()))
    }
}

#[derive(uniffi::Object)]
pub struct Topic(ByteString);

impl Topic {
    pub(crate) fn to_inner(&self) -> p2panda_core::Topic {
        self.0.0
    }
}

#[uniffi::export]
impl Topic {
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

impl From<p2panda_core::Topic> for Topic {
    fn from(value: p2panda_core::Topic) -> Self {
        Self(ByteString::from(value))
    }
}

#[derive(Debug, uniffi::Object)]
pub struct VerifyingKey(p2panda_core::VerifyingKey);

impl VerifyingKey {
    pub(crate) fn to_inner(&self) -> p2panda_core::VerifyingKey {
        self.0
    }
}

#[uniffi::export]
impl VerifyingKey {
    #[uniffi::constructor]
    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        Ok(Self(p2panda_core::VerifyingKey::try_from(value)?))
    }

    #[uniffi::constructor]
    pub fn from_hex(value: &str) -> Result<Self, ConversionError> {
        Ok(Self(p2panda_core::VerifyingKey::from_str(value)?))
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.as_bytes().to_vec()
    }

    pub fn to_hex(&self) -> String {
        self.0.to_hex()
    }

    pub fn verify(&self, bytes: &[u8], signature: Arc<Signature>) -> bool {
        self.0.verify(bytes, &signature.0)
    }
}

impl From<p2panda_core::VerifyingKey> for VerifyingKey {
    fn from(value: p2panda_core::VerifyingKey) -> Self {
        Self(value)
    }
}

#[derive(uniffi::Object)]
pub struct SigningKey(p2panda_core::SigningKey);

impl SigningKey {
    pub(crate) fn to_inner(&self) -> p2panda_core::SigningKey {
        self.0.clone()
    }
}

#[uniffi::export]
impl SigningKey {
    #[uniffi::constructor]
    pub fn generate() -> Self {
        Self(p2panda_core::SigningKey::generate())
    }

    #[uniffi::constructor]
    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        Ok(Self(p2panda_core::SigningKey::try_from(value)?))
    }

    #[uniffi::constructor]
    pub fn from_hex(value: &str) -> Result<Self, ConversionError> {
        let bytes = ByteString::from_hex(value)?.to_bytes();
        Ok(Self(p2panda_core::SigningKey::try_from(&bytes[..])?))
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.as_bytes().to_vec()
    }

    pub fn to_hex(&self) -> String {
        self.0.to_hex()
    }

    pub fn verifying_key(&self) -> VerifyingKey {
        VerifyingKey(self.0.verifying_key())
    }

    pub fn sign(&self, bytes: &[u8]) -> Signature {
        Signature(self.0.sign(bytes))
    }
}

#[derive(uniffi::Object)]
pub struct Signature(p2panda_core::Signature);

#[uniffi::export]
impl Signature {
    #[uniffi::constructor]
    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        Ok(Self(p2panda_core::Signature::try_from(value)?))
    }

    #[uniffi::constructor]
    pub fn from_hex(value: &str) -> Result<Self, ConversionError> {
        let bytes = ByteString::from_hex(value)?.to_bytes();
        Ok(Self(p2panda_core::Signature::try_from(&bytes[..])?))
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.to_bytes().into()
    }

    pub fn to_hex(&self) -> String {
        self.0.to_hex()
    }
}

#[derive(Debug, uniffi::Object)]
pub struct Hash(p2panda_core::Hash);

impl Hash {
    pub(crate) fn to_inner(&self) -> p2panda_core::Hash {
        self.0
    }
}

#[uniffi::export]
impl Hash {
    #[uniffi::constructor]
    pub fn digest(value: &[u8]) -> Self {
        Self(p2panda_core::Hash::digest(value))
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
pub struct RelayUrl(p2panda::RelayUrl);

impl RelayUrl {
    pub(crate) fn to_inner(&self) -> p2panda::RelayUrl {
        self.0.clone()
    }
}

#[uniffi::export]
impl RelayUrl {
    #[uniffi::constructor]
    #[allow(clippy::should_implement_trait)]
    pub fn from_str(value: &str) -> Result<Self, RelayUrlParseError> {
        Ok(Self(p2panda::RelayUrl::from_str(value).map_err(|err| {
            RelayUrlParseError::Invalid(err.to_string())
        })?))
    }

    pub fn to_str(&self) -> String {
        self.0.to_string()
    }
}

#[derive(Debug, Error, uniffi::Error)]
#[uniffi(flat_error)]
pub enum RelayUrlParseError {
    #[error("invalid iroh relay url: {0}")]
    Invalid(String),
}

#[derive(uniffi::Object)]
pub struct Header(p2panda::operation::Header);

#[uniffi::export]
impl Header {
    pub fn version(&self) -> u16 {
        self.0.version
    }

    pub fn hash(&self) -> Arc<Hash> {
        Arc::new(self.0.hash().into())
    }

    pub fn verifying_key(&self) -> Arc<VerifyingKey> {
        Arc::new(self.0.verifying_key.into())
    }

    pub fn signature(&self) -> Arc<Signature> {
        Arc::new(Signature(self.0.signature))
    }

    pub fn payload_size(&self) -> u32 {
        self.0.payload_size
    }

    pub fn payload_hash(&self) -> Arc<Hash> {
        Arc::new(
            self.0
                .payload_hash
                .expect("payload hash always exists")
                .into(),
        )
    }

    pub fn seq_num(&self) -> u32 {
        self.0.seq_num
    }

    pub fn backlink(&self) -> Option<Arc<Hash>> {
        self.0.backlink.map(|hash| Arc::new(hash.into()))
    }

    pub fn prune_flag(&self) -> bool {
        self.0.extensions.prune_flag().is_set()
    }

    pub fn log_id(&self) -> Arc<Hash> {
        let hash = p2panda_core::Hash::from(self.0.extensions.log_id().as_bytes());
        Arc::new(hash.into())
    }
}

impl From<&p2panda::operation::Header> for Header {
    fn from(value: &p2panda::operation::Header) -> Self {
        Self(value.clone())
    }
}

#[derive(uniffi::Object)]
pub struct Cursor(
    p2panda_core::cursor::Cursor<p2panda_core::identity::VerifyingKey, p2panda::operation::LogId>,
);

impl Cursor {
    pub(crate) fn to_inner(
        &self,
    ) -> p2panda_core::Cursor<p2panda_core::VerifyingKey, p2panda::operation::LogId> {
        self.0.clone()
    }
}

#[uniffi::export]
impl Cursor {
    pub fn name(&self) -> String {
        self.0.name().to_string()
    }
}

impl
    From<
        &p2panda_core::cursor::Cursor<
            p2panda_core::identity::VerifyingKey,
            p2panda::operation::LogId,
        >,
    > for Cursor
{
    fn from(
        value: &p2panda_core::cursor::Cursor<
            p2panda_core::identity::VerifyingKey,
            p2panda::operation::LogId,
        >,
    ) -> Self {
        Self(value.clone())
    }
}
