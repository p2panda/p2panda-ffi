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

/// Identifier for a network.
///
/// The network identifier is used to achieve separation and prevent interoperability between
/// distinct networks. This is the most global identifier to group nodes into networks. Different
/// applications may choose to share the same underlying network infrastructure by using the same
/// network identifier.
///
/// A BLAKE3 hash function is performed against each protocol identifier which is registered with
/// `p2panda-net`, using the network identifier as an additional input. Even if two instances of
/// `p2panda-net` are created with the same network protocols, any communication attempts will fail
/// if they are not using the same network identifier.
///
/// **WARNING:** The network identifier is _not_ confidentially exchanged with a remote node and
/// can not be treated as a secret value. See: <https://github.com/p2panda/p2panda/issues/965>
#[derive(uniffi::Object)]
pub struct NetworkId(ByteString);

impl NetworkId {
    pub(crate) fn to_inner(&self) -> p2panda::NetworkId {
        (&self.0).into()
    }
}

#[uniffi::export]
impl NetworkId {
    /// Generate new, random network identifier.
    #[uniffi::constructor]
    pub fn random() -> Self {
        Self(ByteString::random())
    }

    /// Creates network identifier from raw bytes.
    ///
    /// Needs to be exactly 32 bytes, otherwise conversion will fail.
    #[uniffi::constructor]
    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        Ok(Self(ByteString::from_bytes(value)?))
    }

    /// Creates network identifier from hash.
    #[uniffi::constructor]
    pub fn from_hash(hash: Arc<Hash>) -> Self {
        Self(ByteString::from_hash(hash))
    }

    /// Creates network identifier from hexadecimal string.
    ///
    /// Needs to be exactly 64 valid, hexadecimal characters, otherwise conversion will fail.
    #[uniffi::constructor]
    pub fn from_hex(value: &str) -> Result<Self, ConversionError> {
        Ok(Self(ByteString::from_hex(value)?))
    }

    /// Returns network id represented in bytes.
    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.to_bytes()
    }

    /// Returns network id represented as a hexadecimal string.
    pub fn to_hex(&self) -> String {
        self.0.to_hex()
    }
}

impl From<p2panda::NetworkId> for NetworkId {
    fn from(value: p2panda::NetworkId) -> Self {
        Self(ByteString(value.into()))
    }
}

/// Identifier for a gossip- or sync topic.
///
/// A topic identifier is required when subscribing or publishing to a stream.
///
/// Topics usually describe concrete data which nodes want to exchange over, for example a document
/// id or chat group id and so forth. Applications usually want to share topics via a secure side
/// channel.
///
/// **WARNING:** Sensitive topics have to be treated like secret values and generated using a
/// cryptographically secure pseudorandom number generator (CSPRNG). Otherwise they can be easily
/// guessed by third parties or leaked during discovery.
#[derive(uniffi::Object)]
pub struct Topic(ByteString);

impl Topic {
    pub(crate) fn to_inner(&self) -> p2panda_core::Topic {
        self.0.0
    }
}

#[uniffi::export]
impl Topic {
    /// Generate new, random topic.
    #[uniffi::constructor]
    pub fn random() -> Self {
        Self(ByteString::random())
    }

    /// Creates topic from raw bytes.
    ///
    /// Needs to be exactly 32 bytes, otherwise conversion will fail.
    #[uniffi::constructor]
    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        Ok(Self(ByteString::from_bytes(value)?))
    }

    /// Creates topic from hash.
    #[uniffi::constructor]
    pub fn from_hash(hash: Arc<Hash>) -> Self {
        Self(ByteString::from_hash(hash))
    }

    /// Creates topic from hexadecimal string.
    ///
    /// Needs to be exactly 64 valid, hexadecimal characters, otherwise conversion will fail.
    #[uniffi::constructor]
    pub fn from_hex(value: &str) -> Result<Self, ConversionError> {
        Ok(Self(ByteString::from_hex(value)?))
    }

    /// Returns topic represented in bytes.
    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.to_bytes()
    }

    /// Returns topic represented as a hexadecimal string.
    pub fn to_hex(&self) -> String {
        self.0.to_hex()
    }
}

impl From<p2panda_core::Topic> for Topic {
    fn from(value: p2panda_core::Topic) -> Self {
        Self(ByteString::from(value))
    }
}

/// Public Ed25519 key used for identifying peers and verifying signed data.
#[derive(Debug, uniffi::Object)]
pub struct VerifyingKey(p2panda_core::VerifyingKey);

impl VerifyingKey {
    pub(crate) fn to_inner(&self) -> p2panda_core::VerifyingKey {
        self.0
    }
}

#[uniffi::export]
impl VerifyingKey {
    /// Creates verifying key from raw bytes.
    ///
    /// Needs to be exactly 32 bytes, otherwise conversion will fail.
    #[uniffi::constructor]
    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        Ok(Self(p2panda_core::VerifyingKey::try_from(value)?))
    }

    /// Creates verifying key from hexadecimal string.
    ///
    /// Needs to be exactly 64 valid, hexadecimal characters, otherwise conversion will fail.
    #[uniffi::constructor]
    pub fn from_hex(value: &str) -> Result<Self, ConversionError> {
        Ok(Self(p2panda_core::VerifyingKey::from_str(value)?))
    }

    /// Returns verifying key represented in bytes.
    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.as_bytes().to_vec()
    }

    /// Returns verifying key represented as a hexadecimal string.
    pub fn to_hex(&self) -> String {
        self.0.to_hex()
    }

    /// Verify a signature over a byte slice with this public key.
    pub fn verify(&self, bytes: &[u8], signature: Arc<Signature>) -> bool {
        self.0.verify(bytes, &signature.0)
    }
}

impl From<p2panda_core::VerifyingKey> for VerifyingKey {
    fn from(value: p2panda_core::VerifyingKey) -> Self {
        Self(value)
    }
}

/// Private Ed25519 key used for digital signatures.
#[derive(uniffi::Object)]
pub struct SigningKey(p2panda_core::SigningKey);

impl SigningKey {
    pub(crate) fn to_inner(&self) -> p2panda_core::SigningKey {
        self.0.clone()
    }
}

#[uniffi::export]
impl SigningKey {
    /// Generates a new signing key using the system's random number generator (CSPRNG) as a seed.
    #[uniffi::constructor]
    pub fn generate() -> Self {
        Self(p2panda_core::SigningKey::generate())
    }

    /// Creates signing key from raw bytes.
    ///
    /// Needs to be exactly 32 bytes and valid Ed25519 signing key, otherwise conversion will fail.
    #[uniffi::constructor]
    pub fn from_bytes(value: &[u8]) -> Result<Self, ConversionError> {
        Ok(Self(p2panda_core::SigningKey::try_from(value)?))
    }

    /// Creates signing key from hexadecimal string.
    ///
    /// Needs to be exactly 64 valid, hexadecimal characters and valid Ed25519 signing key,
    /// otherwise conversion will fail.
    #[uniffi::constructor]
    pub fn from_hex(value: &str) -> Result<Self, ConversionError> {
        let bytes = ByteString::from_hex(value)?.to_bytes();
        Ok(Self(p2panda_core::SigningKey::try_from(&bytes[..])?))
    }

    /// Returns signing key represented in bytes.
    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.as_bytes().to_vec()
    }

    /// Returns signing key represented in a hexadecimal string.
    pub fn to_hex(&self) -> String {
        self.0.to_hex()
    }

    /// Returns public key using this signing counterpart.
    pub fn verifying_key(&self) -> VerifyingKey {
        VerifyingKey(self.0.verifying_key())
    }

    /// Sign the provided bytestring using this signing key returning a digital signature.
    pub fn sign(&self, bytes: &[u8]) -> Signature {
        Signature(self.0.sign(bytes))
    }
}

/// Ed25519 signature.
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

/// 32-byte BLAKE3 hash.
#[derive(Debug, uniffi::Object)]
pub struct Hash(p2panda_core::Hash);

impl Hash {
    pub(crate) fn to_inner(&self) -> p2panda_core::Hash {
        self.0
    }
}

#[uniffi::export]
impl Hash {
    /// Calculate the hash of the provided bytes.
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

/// A URL identifying an iroh relay server.
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

/// Header of a p2panda operation.
#[derive(uniffi::Object)]
pub struct Header(p2panda::operation::Header);

#[uniffi::export]
impl Header {
    /// Operation format version, allowing backwards compatibility when specification changes.
    pub fn version(&self) -> u64 {
        self.0.version
    }

    /// BLAKE3 hash of the header bytes.
    ///
    /// This hash is used as the unique identifier of an operation, aka the Operation Id.
    pub fn hash(&self) -> Arc<Hash> {
        Arc::new(self.0.hash().into())
    }

    /// Author of this operation.
    pub fn verifying_key(&self) -> Arc<VerifyingKey> {
        Arc::new(self.0.verifying_key.into())
    }

    /// Signature by author over all fields in header, providing authenticity.
    pub fn signature(&self) -> Arc<Signature> {
        Arc::new(Signature(
            self.0.signature.expect("signature always exists"),
        ))
    }

    /// Time in microseconds since the Unix epoch.
    pub fn timestamp(&self) -> u64 {
        self.0.timestamp.into()
    }

    /// Number of bytes of the body of this operation, must be zero if no body is given.
    pub fn payload_size(&self) -> u64 {
        self.0.payload_size
    }

    /// Hash of the body of this operation, must be included if payload_size is non-zero and
    /// omitted otherwise.
    ///
    /// Keeping the hash here allows us to delete the payload (off-chain data) while retaining the
    /// ability to check the signature of the header.
    pub fn payload_hash(&self) -> Arc<Hash> {
        Arc::new(
            self.0
                .payload_hash
                .expect("payload hash always exists")
                .into(),
        )
    }

    /// Number of operations this author has published to this log, begins with 0 and is always
    /// incremented by 1 with each new operation by the same author.
    pub fn seq_num(&self) -> u64 {
        self.0.seq_num
    }

    /// Hash of the previous operation of the same author and log. Can be omitted if first
    /// operation in log.
    pub fn backlink(&self) -> Option<Arc<Hash>> {
        self.0.backlink.map(|hash| Arc::new(hash.into()))
    }

    pub fn prune_flag(&self) -> bool {
        self.0.extensions.prune_flag.is_set()
    }

    pub fn log_id(&self) -> Arc<Hash> {
        let hash = p2panda_core::Hash::from(self.0.extensions.log_id.as_bytes());
        Arc::new(hash.into())
    }
}

impl From<&p2panda::operation::Header> for Header {
    fn from(value: &p2panda::operation::Header) -> Self {
        Self(value.clone())
    }
}

/// Cursor to track log heights (state vector).
///
/// It offers methods to "advance" a log and compute the difference to another state vector. A
/// cursor can be used to manage a state vector over a topic ("log heights" of logs scoped by a
/// topic).
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
