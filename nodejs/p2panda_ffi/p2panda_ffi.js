import koffi from "koffi";


import {

  configureRuntimeHooks,

  ffiFunctions,

  getFfiBindings,

  getFfiTypes,

} from "./p2panda_ffi-ffi.js";


import {

  createForeignBytes,

  RustBufferValue,

} from "./runtime/ffi-types.js";


import {

  AbstractFfiConverterByteArray,

  FfiConverterArray,

  FfiConverterBool,

  FfiConverterBytes,

  FfiConverterOptional,

  FfiConverterString,

  FfiConverterUInt16,

  FfiConverterUInt64,

} from "./runtime/ffi-converters.js";


import {

  UnexpectedEnumCase,

} from "./runtime/errors.js";


import {

  rustCallAsync,

  rustFutureContinuationCallback,

} from "./runtime/async-rust-call.js";


import {

  clearPendingForeignFutures,

  createCallbackRegistry,

  invokeCallbackMethod,

} from "./runtime/callbacks.js";


import {

  createObjectConverter,

  createObjectFactory,

  UniffiObjectBase,

  UNIFFI_OBJECT_HANDLE_SIZE,

} from "./runtime/objects.js";


import {

  CALL_SUCCESS,

  UniffiRustCaller,

  createRustCallStatus,

} from "./runtime/rust-call.js";


export const componentMetadata = Object.freeze({
  namespace: "p2panda_ffi",
  packageName: "p2panda_ffi",
  cdylibName: "p2panda_ffi",
  nodeEngine: ">=16",
  bundledPrebuilds: false,
  manualLoad: false,
});

export { ffiMetadata } from "./p2panda_ffi-ffi.js";


function uniffiNotImplemented(member) {
  throw new Error(`${member} is not implemented yet. Koffi-backed bindings are still pending.`);
}

const uniffiTextEncoder = new TextEncoder();
const uniffiTextDecoder = new TextDecoder();
const uniffiSuccessRustCallStatus = createRustCallStatus();
const UNIFFI_MAX_CACHED_RUST_CALL_STATUSES = 32;
const uniffiRustCallStatusPool = [];

function uniffiLiftString(bytes) {
  return uniffiTextDecoder.decode(bytes);
}

function uniffiDecodeRustCallStatus(status) {
  return status == null
    ? uniffiSuccessRustCallStatus
    : koffi.decode(status, 0, "int8_t") === 0
      ? uniffiSuccessRustCallStatus
      : koffi.decode(status, getFfiTypes().RustCallStatus);
}

function uniffiWriteRustCallStatus(status, value) {
  if (
    status != null
    && (
      value.code !== 0
      || value.error_buf.data !== null
      || value.error_buf.len !== 0n
      || value.error_buf.capacity !== 0n
    )
  ) {
    koffi.encode(status, getFfiTypes().RustCallStatus, value);
  }
  return status;
}

function uniffiAcquireRustCallStatus() {
  const status = uniffiRustCallStatusPool.pop();
  if (status != null) {
    return status;
  }
  return koffi.alloc(getFfiTypes().RustCallStatus, 1);
}

function uniffiReleaseRustCallStatus(status) {
  if (status == null) {
    return;
  }

  koffi.encode(status, getFfiTypes().RustCallStatus, uniffiSuccessRustCallStatus);
  if (uniffiRustCallStatusPool.length < UNIFFI_MAX_CACHED_RUST_CALL_STATUSES) {
    uniffiRustCallStatusPool.push(status);
    return;
  }

  koffi.free(status);
}

const uniffiRustCaller = new UniffiRustCaller({
  createStatus: uniffiAcquireRustCallStatus,
  disposeStatus: uniffiReleaseRustCallStatus,
  readStatus: uniffiDecodeRustCallStatus,
  writeStatus: uniffiWriteRustCallStatus,
  liftString: uniffiLiftString,
});

function uniffiFreeRustBuffer(buffer) {
  return uniffiRustCaller.rustCall(
    (status) => ffiFunctions.ffi_p2panda_ffi_rustbuffer_free(buffer, status),
    { liftString: uniffiLiftString },
  );
}

const uniffiDefaultRustCallOptions = Object.freeze({
  freeRustBuffer: uniffiFreeRustBuffer,
  liftString: uniffiLiftString,
  rustCaller: uniffiRustCaller,
});
const uniffiRustCallOptionsByErrorConverter = new WeakMap();
const uniffiOptionalConverterCache = new WeakMap();
const uniffiArrayConverterCache = new WeakMap();
const uniffiLibraryFunctionCache = new WeakMap();

function uniffiRustCallOptions(errorConverter = undefined) {
  if (errorConverter == null) {
    return uniffiDefaultRustCallOptions;
  }

  if (typeof errorConverter !== "object" && typeof errorConverter !== "function") {
    return Object.freeze({
      errorHandler: (errorBytes) => errorConverter.lift(errorBytes),
      freeRustBuffer: uniffiFreeRustBuffer,
      liftString: uniffiLiftString,
      rustCaller: uniffiRustCaller,
    });
  }

  const cachedOptions = uniffiRustCallOptionsByErrorConverter.get(errorConverter);
  if (cachedOptions != null) {
    return cachedOptions;
  }

  const options = Object.freeze({
    errorHandler: (errorBytes) => errorConverter.lift(errorBytes),
    freeRustBuffer: uniffiFreeRustBuffer,
    liftString: uniffiLiftString,
    rustCaller: uniffiRustCaller,
  });
  uniffiRustCallOptionsByErrorConverter.set(errorConverter, options);
  return options;
}

function uniffiOptionalConverter(innerConverter) {
  let converter = uniffiOptionalConverterCache.get(innerConverter);
  if (converter == null) {
    converter = new FfiConverterOptional(innerConverter);
    uniffiOptionalConverterCache.set(innerConverter, converter);
  }
  return converter;
}

function uniffiArrayConverter(innerConverter) {
  let converter = uniffiArrayConverterCache.get(innerConverter);
  if (converter == null) {
    converter = new FfiConverterArray(innerConverter);
    uniffiArrayConverterCache.set(innerConverter, converter);
  }
  return converter;
}

function uniffiGetCachedLibraryFunction(cacheKey, create) {
  const bindings = getFfiBindings();
  const library = bindings.library;
  let libraryCache = uniffiLibraryFunctionCache.get(library);
  if (libraryCache == null) {
    libraryCache = new Map();
    uniffiLibraryFunctionCache.set(library, libraryCache);
  }

  let cachedFunction = libraryCache.get(cacheKey);
  if (cachedFunction == null) {
    cachedFunction = create(bindings);
    libraryCache.set(cacheKey, cachedFunction);
  }
  return cachedFunction;
}

function uniffiCopyIntoRustBuffer(bytes) {
  return uniffiRustCaller.rustCall(
    (status) => ffiFunctions.ffi_p2panda_ffi_rustbuffer_from_bytes(createForeignBytes(bytes), status),
    uniffiRustCallOptions(),
  );
}

function uniffiLowerString(value) {
  return uniffiCopyIntoRustBuffer(uniffiTextEncoder.encode(value));
}

function uniffiLiftStringFromRustBuffer(value) {
  return uniffiLiftString(new RustBufferValue(value).consumeIntoUint8Array(uniffiFreeRustBuffer));
}

function uniffiLowerBytes(value) {
  return uniffiCopyIntoRustBuffer(value);
}

function uniffiLiftBytesFromRustBuffer(value) {
  return new RustBufferValue(value).consumeIntoUint8Array(uniffiFreeRustBuffer);
}

function uniffiLowerIntoRustBuffer(converter, value) {
  return uniffiCopyIntoRustBuffer(converter.lower(value));
}

function uniffiLiftFromRustBuffer(converter, value) {
  return converter.lift(uniffiLiftBytesFromRustBuffer(value));
}

function uniffiRequireRecordObject(typeName, value) {
  if (typeof value !== "object" || value == null) {
    throw new TypeError(`${typeName} values must be non-null objects.`);
  }
  return value;
}

function uniffiRequireFlatEnumValue(enumValues, typeName, value) {
  for (const enumValue of Object.values(enumValues)) {
    if (enumValue === value) {
      return enumValue;
    }
  }
  throw new TypeError(`${typeName} values must be one of ${Object.values(enumValues).map((item) => JSON.stringify(item)).join(", ")}.`);
}

function uniffiRequireTaggedEnumValue(typeName, value) {
  const enumValue = uniffiRequireRecordObject(typeName, value);
  if (typeof enumValue.tag !== "string") {
    throw new TypeError(`${typeName} values must be tagged objects with a string tag field.`);
  }
  return enumValue;
}

function uniffiNotImplementedConverter(typeName) {
  const fail = (member) => {
    throw new Error(`${typeName} converter ${member} is not implemented yet.`);
  };
  return Object.freeze({
    lower() {
      return fail("lower");
    },
    lift() {
      return fail("lift");
    },
    write() {
      return fail("write");
    },
    read() {
      return fail("read");
    },
    allocationSize() {
      return fail("allocationSize");
    },
  });
}

let uniffiRustFutureContinuationPointer = null;

function uniffiGetRustFutureContinuationPointer() {
  if (uniffiRustFutureContinuationPointer == null) {
    const bindings = getFfiBindings();
    uniffiRustFutureContinuationPointer = koffi.register(
      rustFutureContinuationCallback,
      koffi.pointer(bindings.ffiCallbacks.RustFutureContinuationCallback),
    );
  }
  return uniffiRustFutureContinuationPointer;
}

export const AckPolicy = Object.freeze({
  "Explicit": "Explicit",
  "Automatic": "Automatic",
});

export const MdnsDiscoveryMode = Object.freeze({
  "Disabled": "Disabled",
  "Passive": "Passive",
  "Active": "Active",
});

export const SessionPhase = Object.freeze({
  "Sync": "Sync",
  "Live": "Live",
});

export const StreamFrom = Object.freeze({
  Start() {
    return Object.freeze({
      tag: "Start",
    });
  },
  Frontier() {
    return Object.freeze({
      tag: "Frontier",
    });
  },
  Cursor(_) {
    return Object.freeze({
      tag: "Cursor",
      "": _,
    });
  },
});

export const Source = Object.freeze({
  SyncSession(remote_node_id, session_id, sent_operations, received_operations, sent_bytes, received_bytes, sent_bytes_topic_total, received_bytes_topic_total, phase) {
    return Object.freeze({
      tag: "SyncSession",
      "remote_node_id": remote_node_id,
      "session_id": session_id,
      "sent_operations": sent_operations,
      "received_operations": received_operations,
      "sent_bytes": sent_bytes,
      "received_bytes": received_bytes,
      "sent_bytes_topic_total": sent_bytes_topic_total,
      "received_bytes_topic_total": received_bytes_topic_total,
      "phase": phase,
    });
  },
  LocalStore() {
    return Object.freeze({
      tag: "LocalStore",
    });
  },
});

export const StreamEvent = Object.freeze({
  SyncStarted(remote_node_id, session_id, incoming_operations, outgoing_operations, incoming_bytes, outgoing_bytes, topic_sessions) {
    return Object.freeze({
      tag: "SyncStarted",
      "remote_node_id": remote_node_id,
      "session_id": session_id,
      "incoming_operations": incoming_operations,
      "outgoing_operations": outgoing_operations,
      "incoming_bytes": incoming_bytes,
      "outgoing_bytes": outgoing_bytes,
      "topic_sessions": topic_sessions,
    });
  },
  SyncEnded(remote_node_id, session_id, sent_operations, received_operations, sent_bytes, received_bytes, sent_bytes_topic_total, received_bytes_topic_total, error) {
    return Object.freeze({
      tag: "SyncEnded",
      "remote_node_id": remote_node_id,
      "session_id": session_id,
      "sent_operations": sent_operations,
      "received_operations": received_operations,
      "sent_bytes": sent_bytes,
      "received_bytes": received_bytes,
      "sent_bytes_topic_total": sent_bytes_topic_total,
      "received_bytes_topic_total": received_bytes_topic_total,
      "error": error,
    });
  },
});

export class IpAddrError extends globalThis.Error {
  constructor(tag, message = tag) {
    super(message);
    this.name = "IpAddrError";
    this.tag = tag;
  }
}

export class IpAddrErrorParseInvalidAddr extends IpAddrError {
  constructor(message = undefined) {
    super("ParseInvalidAddr", message ?? "ParseInvalidAddr");
    this.name = "IpAddrErrorParseInvalidAddr";
    this.message = message ?? "ParseInvalidAddr";
  }
}

export class NodeBuilderError extends globalThis.Error {
  constructor(tag, message = tag) {
    super(message);
    this.name = "NodeBuilderError";
    this.tag = tag;
  }
}

export class NodeBuilderErrorAlreadyConsumed extends NodeBuilderError {
  constructor(message = undefined) {
    super("AlreadyConsumed", message ?? "AlreadyConsumed");
    this.name = "NodeBuilderErrorAlreadyConsumed";
    this.message = message ?? "AlreadyConsumed";
  }
}

export class NodeBuilderErrorMutexPoisoned extends NodeBuilderError {
  constructor(message = undefined) {
    super("MutexPoisoned", message ?? "MutexPoisoned");
    this.name = "NodeBuilderErrorMutexPoisoned";
    this.message = message ?? "MutexPoisoned";
  }
}

export class NodeBuilderErrorIpAddr extends NodeBuilderError {
  constructor(message = undefined) {
    super("IpAddr", message ?? "IpAddr");
    this.name = "NodeBuilderErrorIpAddr";
    this.message = message ?? "IpAddr";
  }
}

export class ConversionError extends globalThis.Error {
  constructor(tag, message = tag) {
    super(message);
    this.name = "ConversionError";
    this.tag = tag;
  }
}

/**
 * Invalid number of bytes.
 */
export class ConversionErrorInvalidLength extends ConversionError {
  constructor(message = undefined) {
    super("InvalidLength", message ?? "InvalidLength");
    this.name = "ConversionErrorInvalidLength";
    this.message = message ?? "InvalidLength";
  }
}

/**
 * String contains invalid hexadecimal characters.
 */
export class ConversionErrorInvalidHexEncoding extends ConversionError {
  constructor(message = undefined) {
    super("InvalidHexEncoding", message ?? "InvalidHexEncoding");
    this.name = "ConversionErrorInvalidHexEncoding";
    this.message = message ?? "InvalidHexEncoding";
  }
}

export class RelayUrlParseError extends globalThis.Error {
  constructor(tag, message = tag) {
    super(message);
    this.name = "RelayUrlParseError";
    this.tag = tag;
  }
}

export class RelayUrlParseErrorInvalid extends RelayUrlParseError {
  constructor(message = undefined) {
    super("Invalid", message ?? "Invalid");
    this.name = "RelayUrlParseErrorInvalid";
    this.message = message ?? "Invalid";
  }
}

export class EphemeralPublishError extends globalThis.Error {
  constructor(tag, message = tag) {
    super(message);
    this.name = "EphemeralPublishError";
    this.tag = tag;
  }
}

export class EphemeralPublishErrorEphemeralPublish extends EphemeralPublishError {
  constructor(message = undefined) {
    super("EphemeralPublish", message ?? "EphemeralPublish");
    this.name = "EphemeralPublishErrorEphemeralPublish";
    this.message = message ?? "EphemeralPublish";
  }
}

export class CreateStreamError extends globalThis.Error {
  constructor(tag, message = tag) {
    super(message);
    this.name = "CreateStreamError";
    this.tag = tag;
  }
}

export class CreateStreamErrorCreateStream extends CreateStreamError {
  constructor(message = undefined) {
    super("CreateStream", message ?? "CreateStream");
    this.name = "CreateStreamErrorCreateStream";
    this.message = message ?? "CreateStream";
  }
}

export class NetworkError extends globalThis.Error {
  constructor(tag, message = tag) {
    super(message);
    this.name = "NetworkError";
    this.tag = tag;
  }
}

export class NetworkErrorNetwork extends NetworkError {
  constructor(message = undefined) {
    super("Network", message ?? "Network");
    this.name = "NetworkErrorNetwork";
    this.message = message ?? "Network";
  }
}

export class SpawnError extends globalThis.Error {
  constructor(tag, message = tag) {
    super(message);
    this.name = "SpawnError";
    this.tag = tag;
  }
}

export class SpawnErrorSpawn extends SpawnError {
  constructor(message = undefined) {
    super("Spawn", message ?? "Spawn");
    this.name = "SpawnErrorSpawn";
    this.message = message ?? "Spawn";
  }
}

export class SpawnErrorNodeBuilder extends SpawnError {
  constructor(message = undefined) {
    super("NodeBuilder", message ?? "NodeBuilder");
    this.name = "SpawnErrorNodeBuilder";
    this.message = message ?? "NodeBuilder";
  }
}

export class SpawnErrorRpc extends SpawnError {
  constructor(message = undefined) {
    super("Rpc", message ?? "Rpc");
    this.name = "SpawnErrorRpc";
    this.message = message ?? "Rpc";
  }
}

export class AckedError extends globalThis.Error {
  constructor(tag, message = tag) {
    super(message);
    this.name = "AckedError";
    this.tag = tag;
  }
}

export class AckedErrorAckedError extends AckedError {
  constructor(message = undefined) {
    super("AckedError", message ?? "AckedError");
    this.name = "AckedErrorAckedError";
    this.message = message ?? "AckedError";
  }
}

export class PublishError extends globalThis.Error {
  constructor(tag, message = tag) {
    super(message);
    this.name = "PublishError";
    this.tag = tag;
  }
}

export class PublishErrorPublishError extends PublishError {
  constructor(message = undefined) {
    super("PublishError", message ?? "PublishError");
    this.name = "PublishErrorPublishError";
    this.message = message ?? "PublishError";
  }
}

export class StreamError extends globalThis.Error {
  constructor(tag, message = tag) {
    super(message);
    this.name = "StreamError";
    this.tag = tag;
  }
}

export class StreamErrorProcessingFailed extends StreamError {
  constructor(message = undefined) {
    super("ProcessingFailed", message ?? "ProcessingFailed");
    this.name = "StreamErrorProcessingFailed";
    this.message = message ?? "ProcessingFailed";
  }
}

export class StreamErrorDecodeFailed extends StreamError {
  constructor(message = undefined) {
    super("DecodeFailed", message ?? "DecodeFailed");
    this.name = "StreamErrorDecodeFailed";
    this.message = message ?? "DecodeFailed";
  }
}

export class StreamErrorReplayFailed extends StreamError {
  constructor(message = undefined) {
    super("ReplayFailed", message ?? "ReplayFailed");
    this.name = "StreamErrorReplayFailed";
    this.message = message ?? "ReplayFailed";
  }
}

export class StreamErrorAckFailed extends StreamError {
  constructor(message = undefined) {
    super("AckFailed", message ?? "AckFailed");
    this.name = "StreamErrorAckFailed";
    this.message = message ?? "AckFailed";
  }
}

export class SyncError extends globalThis.Error {
  constructor(tag, message = tag) {
    super(message);
    this.name = "SyncError";
    this.tag = tag;
  }
}

export class SyncErrorSyncError extends SyncError {
  constructor(message = undefined) {
    super("SyncError", message ?? "SyncError");
    this.name = "SyncErrorSyncError";
    this.message = message ?? "SyncError";
  }
}

const FfiConverterAckPolicy = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    uniffiRequireFlatEnumValue(AckPolicy, "AckPolicy", value);
    return 4;
  }

  write(value, writer) {
    const enumValue = uniffiRequireFlatEnumValue(AckPolicy, "AckPolicy", value);
    switch (enumValue) {
      case AckPolicy["Explicit"]:
        writer.writeInt32(1);
        return;
      case AckPolicy["Automatic"]:
        writer.writeInt32(2);
        return;
      default:
        throw new UnexpectedEnumCase(`Unexpected AckPolicy case ${String(enumValue)}.`);
    }
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return AckPolicy["Explicit"];
      case 2:
        return AckPolicy["Automatic"];
      default:
        throw new UnexpectedEnumCase(`Unexpected AckPolicy case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterMdnsDiscoveryMode = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    uniffiRequireFlatEnumValue(MdnsDiscoveryMode, "MdnsDiscoveryMode", value);
    return 4;
  }

  write(value, writer) {
    const enumValue = uniffiRequireFlatEnumValue(MdnsDiscoveryMode, "MdnsDiscoveryMode", value);
    switch (enumValue) {
      case MdnsDiscoveryMode["Disabled"]:
        writer.writeInt32(1);
        return;
      case MdnsDiscoveryMode["Passive"]:
        writer.writeInt32(2);
        return;
      case MdnsDiscoveryMode["Active"]:
        writer.writeInt32(3);
        return;
      default:
        throw new UnexpectedEnumCase(`Unexpected MdnsDiscoveryMode case ${String(enumValue)}.`);
    }
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return MdnsDiscoveryMode["Disabled"];
      case 2:
        return MdnsDiscoveryMode["Passive"];
      case 3:
        return MdnsDiscoveryMode["Active"];
      default:
        throw new UnexpectedEnumCase(`Unexpected MdnsDiscoveryMode case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterSessionPhase = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    uniffiRequireFlatEnumValue(SessionPhase, "SessionPhase", value);
    return 4;
  }

  write(value, writer) {
    const enumValue = uniffiRequireFlatEnumValue(SessionPhase, "SessionPhase", value);
    switch (enumValue) {
      case SessionPhase["Sync"]:
        writer.writeInt32(1);
        return;
      case SessionPhase["Live"]:
        writer.writeInt32(2);
        return;
      default:
        throw new UnexpectedEnumCase(`Unexpected SessionPhase case ${String(enumValue)}.`);
    }
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return SessionPhase["Sync"];
      case 2:
        return SessionPhase["Live"];
      default:
        throw new UnexpectedEnumCase(`Unexpected SessionPhase case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterStreamFrom = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    const enumValue = uniffiRequireTaggedEnumValue("StreamFrom", value);
    switch (enumValue.tag) {
      case "Start":
        return 4;
      case "Frontier":
        return 4;
      case "Cursor":
        return 4 + FfiConverterCursor.allocationSize(enumValue[""]);
      default:
        throw new UnexpectedEnumCase(`Unexpected StreamFrom case ${String(enumValue.tag)}.`);
    }
  }

  write(value, writer) {
    const enumValue = uniffiRequireTaggedEnumValue("StreamFrom", value);
    switch (enumValue.tag) {
      case "Start":
        writer.writeInt32(1);
        return;
      case "Frontier":
        writer.writeInt32(2);
        return;
      case "Cursor":
        writer.writeInt32(3);
        FfiConverterCursor.write(enumValue[""], writer);
        return;
      default:
        throw new UnexpectedEnumCase(`Unexpected StreamFrom case ${String(enumValue.tag)}.`);
    }
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return StreamFrom.Start();
      case 2:
        return StreamFrom.Frontier();
      case 3:
        return StreamFrom.Cursor(FfiConverterCursor.read(reader));
      default:
        throw new UnexpectedEnumCase(`Unexpected StreamFrom case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterSource = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    const enumValue = uniffiRequireTaggedEnumValue("Source", value);
    switch (enumValue.tag) {
      case "SyncSession":
        return 4 + FfiConverterPublicKey.allocationSize(enumValue["remote_node_id"]) + FfiConverterUInt64.allocationSize(enumValue["session_id"]) + FfiConverterUInt64.allocationSize(enumValue["sent_operations"]) + FfiConverterUInt64.allocationSize(enumValue["received_operations"]) + FfiConverterUInt64.allocationSize(enumValue["sent_bytes"]) + FfiConverterUInt64.allocationSize(enumValue["received_bytes"]) + FfiConverterUInt64.allocationSize(enumValue["sent_bytes_topic_total"]) + FfiConverterUInt64.allocationSize(enumValue["received_bytes_topic_total"]) + FfiConverterSessionPhase.allocationSize(enumValue["phase"]);
      case "LocalStore":
        return 4;
      default:
        throw new UnexpectedEnumCase(`Unexpected Source case ${String(enumValue.tag)}.`);
    }
  }

  write(value, writer) {
    const enumValue = uniffiRequireTaggedEnumValue("Source", value);
    switch (enumValue.tag) {
      case "SyncSession":
        writer.writeInt32(1);
        FfiConverterPublicKey.write(enumValue["remote_node_id"], writer);
        FfiConverterUInt64.write(enumValue["session_id"], writer);
        FfiConverterUInt64.write(enumValue["sent_operations"], writer);
        FfiConverterUInt64.write(enumValue["received_operations"], writer);
        FfiConverterUInt64.write(enumValue["sent_bytes"], writer);
        FfiConverterUInt64.write(enumValue["received_bytes"], writer);
        FfiConverterUInt64.write(enumValue["sent_bytes_topic_total"], writer);
        FfiConverterUInt64.write(enumValue["received_bytes_topic_total"], writer);
        FfiConverterSessionPhase.write(enumValue["phase"], writer);
        return;
      case "LocalStore":
        writer.writeInt32(2);
        return;
      default:
        throw new UnexpectedEnumCase(`Unexpected Source case ${String(enumValue.tag)}.`);
    }
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return Source.SyncSession(FfiConverterPublicKey.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterSessionPhase.read(reader));
      case 2:
        return Source.LocalStore();
      default:
        throw new UnexpectedEnumCase(`Unexpected Source case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterStreamEvent = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    const enumValue = uniffiRequireTaggedEnumValue("StreamEvent", value);
    switch (enumValue.tag) {
      case "SyncStarted":
        return 4 + FfiConverterPublicKey.allocationSize(enumValue["remote_node_id"]) + FfiConverterUInt64.allocationSize(enumValue["session_id"]) + FfiConverterUInt64.allocationSize(enumValue["incoming_operations"]) + FfiConverterUInt64.allocationSize(enumValue["outgoing_operations"]) + FfiConverterUInt64.allocationSize(enumValue["incoming_bytes"]) + FfiConverterUInt64.allocationSize(enumValue["outgoing_bytes"]) + FfiConverterUInt64.allocationSize(enumValue["topic_sessions"]);
      case "SyncEnded":
        return 4 + FfiConverterPublicKey.allocationSize(enumValue["remote_node_id"]) + FfiConverterUInt64.allocationSize(enumValue["session_id"]) + FfiConverterUInt64.allocationSize(enumValue["sent_operations"]) + FfiConverterUInt64.allocationSize(enumValue["received_operations"]) + FfiConverterUInt64.allocationSize(enumValue["sent_bytes"]) + FfiConverterUInt64.allocationSize(enumValue["received_bytes"]) + FfiConverterUInt64.allocationSize(enumValue["sent_bytes_topic_total"]) + FfiConverterUInt64.allocationSize(enumValue["received_bytes_topic_total"]) + uniffiOptionalConverter(FfiConverterSyncError).allocationSize(enumValue["error"]);
      default:
        throw new UnexpectedEnumCase(`Unexpected StreamEvent case ${String(enumValue.tag)}.`);
    }
  }

  write(value, writer) {
    const enumValue = uniffiRequireTaggedEnumValue("StreamEvent", value);
    switch (enumValue.tag) {
      case "SyncStarted":
        writer.writeInt32(1);
        FfiConverterPublicKey.write(enumValue["remote_node_id"], writer);
        FfiConverterUInt64.write(enumValue["session_id"], writer);
        FfiConverterUInt64.write(enumValue["incoming_operations"], writer);
        FfiConverterUInt64.write(enumValue["outgoing_operations"], writer);
        FfiConverterUInt64.write(enumValue["incoming_bytes"], writer);
        FfiConverterUInt64.write(enumValue["outgoing_bytes"], writer);
        FfiConverterUInt64.write(enumValue["topic_sessions"], writer);
        return;
      case "SyncEnded":
        writer.writeInt32(2);
        FfiConverterPublicKey.write(enumValue["remote_node_id"], writer);
        FfiConverterUInt64.write(enumValue["session_id"], writer);
        FfiConverterUInt64.write(enumValue["sent_operations"], writer);
        FfiConverterUInt64.write(enumValue["received_operations"], writer);
        FfiConverterUInt64.write(enumValue["sent_bytes"], writer);
        FfiConverterUInt64.write(enumValue["received_bytes"], writer);
        FfiConverterUInt64.write(enumValue["sent_bytes_topic_total"], writer);
        FfiConverterUInt64.write(enumValue["received_bytes_topic_total"], writer);
        uniffiOptionalConverter(FfiConverterSyncError).write(enumValue["error"], writer);
        return;
      default:
        throw new UnexpectedEnumCase(`Unexpected StreamEvent case ${String(enumValue.tag)}.`);
    }
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return StreamEvent.SyncStarted(FfiConverterPublicKey.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader));
      case 2:
        return StreamEvent.SyncEnded(FfiConverterPublicKey.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), FfiConverterUInt64.read(reader), uniffiOptionalConverter(FfiConverterSyncError).read(reader));
      default:
        throw new UnexpectedEnumCase(`Unexpected StreamEvent case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterIpAddrError = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    if (value instanceof IpAddrErrorParseInvalidAddr) {
      return 4;
    }
    throw new TypeError("IpAddrError values must be instances of IpAddrErrorParseInvalidAddr.");
  }

  write(value, writer) {
    if (value instanceof IpAddrErrorParseInvalidAddr) {
      writer.writeInt32(1);
      return;
    }
    throw new TypeError("IpAddrError values must be instances of IpAddrErrorParseInvalidAddr.");
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return new IpAddrErrorParseInvalidAddr(FfiConverterString.read(reader));
      default:
        throw new UnexpectedEnumCase(`Unexpected IpAddrError case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterNodeBuilderError = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    if (value instanceof NodeBuilderErrorAlreadyConsumed) {
      return 4;
    }
    if (value instanceof NodeBuilderErrorMutexPoisoned) {
      return 4;
    }
    if (value instanceof NodeBuilderErrorIpAddr) {
      return 4;
    }
    throw new TypeError("NodeBuilderError values must be instances of NodeBuilderErrorAlreadyConsumed, NodeBuilderErrorMutexPoisoned, NodeBuilderErrorIpAddr.");
  }

  write(value, writer) {
    if (value instanceof NodeBuilderErrorAlreadyConsumed) {
      writer.writeInt32(1);
      return;
    }
    if (value instanceof NodeBuilderErrorMutexPoisoned) {
      writer.writeInt32(2);
      return;
    }
    if (value instanceof NodeBuilderErrorIpAddr) {
      writer.writeInt32(3);
      return;
    }
    throw new TypeError("NodeBuilderError values must be instances of NodeBuilderErrorAlreadyConsumed, NodeBuilderErrorMutexPoisoned, NodeBuilderErrorIpAddr.");
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return new NodeBuilderErrorAlreadyConsumed(FfiConverterString.read(reader));
      case 2:
        return new NodeBuilderErrorMutexPoisoned(FfiConverterString.read(reader));
      case 3:
        return new NodeBuilderErrorIpAddr(FfiConverterString.read(reader));
      default:
        throw new UnexpectedEnumCase(`Unexpected NodeBuilderError case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterConversionError = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    if (value instanceof ConversionErrorInvalidLength) {
      return 4;
    }
    if (value instanceof ConversionErrorInvalidHexEncoding) {
      return 4;
    }
    throw new TypeError("ConversionError values must be instances of ConversionErrorInvalidLength, ConversionErrorInvalidHexEncoding.");
  }

  write(value, writer) {
    if (value instanceof ConversionErrorInvalidLength) {
      writer.writeInt32(1);
      return;
    }
    if (value instanceof ConversionErrorInvalidHexEncoding) {
      writer.writeInt32(2);
      return;
    }
    throw new TypeError("ConversionError values must be instances of ConversionErrorInvalidLength, ConversionErrorInvalidHexEncoding.");
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return new ConversionErrorInvalidLength(FfiConverterString.read(reader));
      case 2:
        return new ConversionErrorInvalidHexEncoding(FfiConverterString.read(reader));
      default:
        throw new UnexpectedEnumCase(`Unexpected ConversionError case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterRelayUrlParseError = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    if (value instanceof RelayUrlParseErrorInvalid) {
      return 4;
    }
    throw new TypeError("RelayUrlParseError values must be instances of RelayUrlParseErrorInvalid.");
  }

  write(value, writer) {
    if (value instanceof RelayUrlParseErrorInvalid) {
      writer.writeInt32(1);
      return;
    }
    throw new TypeError("RelayUrlParseError values must be instances of RelayUrlParseErrorInvalid.");
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return new RelayUrlParseErrorInvalid(FfiConverterString.read(reader));
      default:
        throw new UnexpectedEnumCase(`Unexpected RelayUrlParseError case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterEphemeralPublishError = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    if (value instanceof EphemeralPublishErrorEphemeralPublish) {
      return 4;
    }
    throw new TypeError("EphemeralPublishError values must be instances of EphemeralPublishErrorEphemeralPublish.");
  }

  write(value, writer) {
    if (value instanceof EphemeralPublishErrorEphemeralPublish) {
      writer.writeInt32(1);
      return;
    }
    throw new TypeError("EphemeralPublishError values must be instances of EphemeralPublishErrorEphemeralPublish.");
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return new EphemeralPublishErrorEphemeralPublish(FfiConverterString.read(reader));
      default:
        throw new UnexpectedEnumCase(`Unexpected EphemeralPublishError case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterCreateStreamError = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    if (value instanceof CreateStreamErrorCreateStream) {
      return 4;
    }
    throw new TypeError("CreateStreamError values must be instances of CreateStreamErrorCreateStream.");
  }

  write(value, writer) {
    if (value instanceof CreateStreamErrorCreateStream) {
      writer.writeInt32(1);
      return;
    }
    throw new TypeError("CreateStreamError values must be instances of CreateStreamErrorCreateStream.");
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return new CreateStreamErrorCreateStream(FfiConverterString.read(reader));
      default:
        throw new UnexpectedEnumCase(`Unexpected CreateStreamError case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterNetworkError = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    if (value instanceof NetworkErrorNetwork) {
      return 4;
    }
    throw new TypeError("NetworkError values must be instances of NetworkErrorNetwork.");
  }

  write(value, writer) {
    if (value instanceof NetworkErrorNetwork) {
      writer.writeInt32(1);
      return;
    }
    throw new TypeError("NetworkError values must be instances of NetworkErrorNetwork.");
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return new NetworkErrorNetwork(FfiConverterString.read(reader));
      default:
        throw new UnexpectedEnumCase(`Unexpected NetworkError case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterSpawnError = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    if (value instanceof SpawnErrorSpawn) {
      return 4;
    }
    if (value instanceof SpawnErrorNodeBuilder) {
      return 4;
    }
    if (value instanceof SpawnErrorRpc) {
      return 4;
    }
    throw new TypeError("SpawnError values must be instances of SpawnErrorSpawn, SpawnErrorNodeBuilder, SpawnErrorRpc.");
  }

  write(value, writer) {
    if (value instanceof SpawnErrorSpawn) {
      writer.writeInt32(1);
      return;
    }
    if (value instanceof SpawnErrorNodeBuilder) {
      writer.writeInt32(2);
      return;
    }
    if (value instanceof SpawnErrorRpc) {
      writer.writeInt32(3);
      return;
    }
    throw new TypeError("SpawnError values must be instances of SpawnErrorSpawn, SpawnErrorNodeBuilder, SpawnErrorRpc.");
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return new SpawnErrorSpawn(FfiConverterString.read(reader));
      case 2:
        return new SpawnErrorNodeBuilder(FfiConverterString.read(reader));
      case 3:
        return new SpawnErrorRpc(FfiConverterString.read(reader));
      default:
        throw new UnexpectedEnumCase(`Unexpected SpawnError case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterAckedError = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    if (value instanceof AckedErrorAckedError) {
      return 4;
    }
    throw new TypeError("AckedError values must be instances of AckedErrorAckedError.");
  }

  write(value, writer) {
    if (value instanceof AckedErrorAckedError) {
      writer.writeInt32(1);
      return;
    }
    throw new TypeError("AckedError values must be instances of AckedErrorAckedError.");
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return new AckedErrorAckedError(FfiConverterString.read(reader));
      default:
        throw new UnexpectedEnumCase(`Unexpected AckedError case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterPublishError = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    if (value instanceof PublishErrorPublishError) {
      return 4;
    }
    throw new TypeError("PublishError values must be instances of PublishErrorPublishError.");
  }

  write(value, writer) {
    if (value instanceof PublishErrorPublishError) {
      writer.writeInt32(1);
      return;
    }
    throw new TypeError("PublishError values must be instances of PublishErrorPublishError.");
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return new PublishErrorPublishError(FfiConverterString.read(reader));
      default:
        throw new UnexpectedEnumCase(`Unexpected PublishError case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterStreamError = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    if (value instanceof StreamErrorProcessingFailed) {
      return 4;
    }
    if (value instanceof StreamErrorDecodeFailed) {
      return 4;
    }
    if (value instanceof StreamErrorReplayFailed) {
      return 4;
    }
    if (value instanceof StreamErrorAckFailed) {
      return 4;
    }
    throw new TypeError("StreamError values must be instances of StreamErrorProcessingFailed, StreamErrorDecodeFailed, StreamErrorReplayFailed, StreamErrorAckFailed.");
  }

  write(value, writer) {
    if (value instanceof StreamErrorProcessingFailed) {
      writer.writeInt32(1);
      return;
    }
    if (value instanceof StreamErrorDecodeFailed) {
      writer.writeInt32(2);
      return;
    }
    if (value instanceof StreamErrorReplayFailed) {
      writer.writeInt32(3);
      return;
    }
    if (value instanceof StreamErrorAckFailed) {
      writer.writeInt32(4);
      return;
    }
    throw new TypeError("StreamError values must be instances of StreamErrorProcessingFailed, StreamErrorDecodeFailed, StreamErrorReplayFailed, StreamErrorAckFailed.");
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return new StreamErrorProcessingFailed(FfiConverterString.read(reader));
      case 2:
        return new StreamErrorDecodeFailed(FfiConverterString.read(reader));
      case 3:
        return new StreamErrorReplayFailed(FfiConverterString.read(reader));
      case 4:
        return new StreamErrorAckFailed(FfiConverterString.read(reader));
      default:
        throw new UnexpectedEnumCase(`Unexpected StreamError case ${String(enumTag)}.`);
    }
  }
})();
const FfiConverterSyncError = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    if (value instanceof SyncErrorSyncError) {
      return 4;
    }
    throw new TypeError("SyncError values must be instances of SyncErrorSyncError.");
  }

  write(value, writer) {
    if (value instanceof SyncErrorSyncError) {
      writer.writeInt32(1);
      return;
    }
    throw new TypeError("SyncError values must be instances of SyncErrorSyncError.");
  }

  read(reader) {
    const enumTag = reader.readInt32();
    switch (enumTag) {
      case 1:
        return new SyncErrorSyncError(FfiConverterString.read(reader));
      default:
        throw new UnexpectedEnumCase(`Unexpected SyncError case ${String(enumTag)}.`);
    }
  }
})();
class UniffiEphemeralStreamCallbackProxy extends UniffiObjectBase {

  on_message(message) {
    const loweredSelf = uniffiEphemeralStreamCallbackFactory.cloneHandle(this);
    const ffiMethod =
      uniffiEphemeralStreamCallbackFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message;
    const loweredMessage = uniffiEphemeralMessageObjectFactory.cloneHandle(message);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredMessage, status),
      uniffiRustCallOptions(),
    );
  }
}

const uniffiEphemeralStreamCallbackFactory = createObjectFactory({
  typeName: "EphemeralStreamCallback",
  createInstance: () => Object.create(UniffiEphemeralStreamCallbackProxy.prototype),
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback(handle, status),
      uniffiRustCallOptions(),
    );
  },
});

function uniffiValidateEphemeralStreamCallbackImplementation(implementation) {
  if ((typeof implementation !== "object" && typeof implementation !== "function") || implementation == null) {
    throw new TypeError(`${"EphemeralStreamCallback"} implementations must be objects with callable methods.`);
  }
  if (typeof implementation.on_message !== "function") {
    throw new TypeError(`${"EphemeralStreamCallback"} is missing required method on_message().`);
  }
  return implementation;
}

const uniffiEphemeralStreamCallbackRegistry = createCallbackRegistry({
  interfaceName: "EphemeralStreamCallback",
  validate: uniffiValidateEphemeralStreamCallbackImplementation,
});

function uniffiRegisterEphemeralStreamCallbackVtable(bindings, registrations, vtableReferences) {
  const on_messageCallback = koffi.register(
    (uniffiHandle, message, uniffiOutReturn, callStatus) => {
      const uniffiStatus = callStatus == null
        ? createRustCallStatus()
        : koffi.decode(callStatus, bindings.ffiTypes.RustCallStatus);
      const uniffiResult = invokeCallbackMethod({
        registry: uniffiEphemeralStreamCallbackRegistry,
        handle: uniffiHandle,
        methodName: "on_message",
        args: [
          uniffiEphemeralMessageObjectFactory.create(message),
        ],
        lowerString: (value) => uniffiLowerString(value),
        status: uniffiStatus,
      });
      if (callStatus != null) {
        koffi.encode(callStatus, bindings.ffiTypes.RustCallStatus, uniffiStatus);
      }
      if (uniffiStatus.code !== CALL_SUCCESS) {
        return;
      }
    },
    koffi.pointer(bindings.ffiCallbacks.CallbackInterfaceEphemeralStreamCallbackMethod0),
  );
  registrations.push(on_messageCallback);
  const uniffiFree = koffi.register(
    (uniffiHandle) => uniffiEphemeralStreamCallbackRegistry.remove(uniffiHandle),
    koffi.pointer(bindings.ffiCallbacks.CallbackInterfaceFree),
  );
  registrations.push(uniffiFree);
  const uniffiClone = koffi.register(
    (uniffiHandle) => uniffiEphemeralStreamCallbackRegistry.cloneHandle(uniffiHandle),
    koffi.pointer(bindings.ffiCallbacks.CallbackInterfaceClone),
  );
  registrations.push(uniffiClone);
  const uniffiVtable = koffi.alloc(bindings.ffiStructs.VTableCallbackInterfaceEphemeralStreamCallback, 1);
  koffi.encode(uniffiVtable, bindings.ffiStructs.VTableCallbackInterfaceEphemeralStreamCallback, {
    uniffi_free: uniffiFree,
    uniffi_clone: uniffiClone,
    "on_message": on_messageCallback,

  });
  vtableReferences.push(uniffiVtable);
  bindings.ffiFunctions.uniffi_p2panda_ffi_fn_init_callback_vtable_ephemeralstreamcallback(uniffiVtable);
}

const FfiConverterEphemeralStreamCallback = Object.freeze({
  lower(value) {
    if (uniffiEphemeralStreamCallbackFactory.isInstance(value)) {
      return uniffiEphemeralStreamCallbackFactory.cloneHandle(value);
    }
    return uniffiEphemeralStreamCallbackRegistry.register(value);
  },
  lift(handle) {
    return uniffiEphemeralStreamCallbackFactory.create(handle);
  },
  write(value, writer) {
    writer.writeUInt64(this.lower(value));
  },
  read(reader) {
    return this.lift(reader.readUInt64());
  },
  allocationSize() {
    return UNIFFI_OBJECT_HANDLE_SIZE;
  },
});
class UniffiTopicStreamCallbackProxy extends UniffiObjectBase {

  on_event(event) {
    const loweredSelf = uniffiTopicStreamCallbackFactory.cloneHandle(this);
    const ffiMethod =
      uniffiTopicStreamCallbackFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event;
    const loweredEvent = uniffiLowerIntoRustBuffer(FfiConverterStreamEvent, event);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredEvent, status),
      uniffiRustCallOptions(),
    );
  }

  on_error(error) {
    const loweredSelf = uniffiTopicStreamCallbackFactory.cloneHandle(this);
    const ffiMethod =
      uniffiTopicStreamCallbackFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error;
    const loweredError = uniffiLowerIntoRustBuffer(FfiConverterStreamError, error);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredError, status),
      uniffiRustCallOptions(),
    );
  }

  on_operation(processed, source) {
    const loweredSelf = uniffiTopicStreamCallbackFactory.cloneHandle(this);
    const ffiMethod =
      uniffiTopicStreamCallbackFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation;
    const loweredProcessed = uniffiProcessedOperationObjectFactory.cloneHandle(processed);
    const loweredSource = uniffiLowerIntoRustBuffer(FfiConverterSource, source);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredProcessed, loweredSource, status),
      uniffiRustCallOptions(),
    );
  }
}

const uniffiTopicStreamCallbackFactory = createObjectFactory({
  typeName: "TopicStreamCallback",
  createInstance: () => Object.create(UniffiTopicStreamCallbackProxy.prototype),
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_topicstreamcallback(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_topicstreamcallback(handle, status),
      uniffiRustCallOptions(),
    );
  },
});

function uniffiValidateTopicStreamCallbackImplementation(implementation) {
  if ((typeof implementation !== "object" && typeof implementation !== "function") || implementation == null) {
    throw new TypeError(`${"TopicStreamCallback"} implementations must be objects with callable methods.`);
  }
  if (typeof implementation.on_event !== "function") {
    throw new TypeError(`${"TopicStreamCallback"} is missing required method on_event().`);
  }
  if (typeof implementation.on_error !== "function") {
    throw new TypeError(`${"TopicStreamCallback"} is missing required method on_error().`);
  }
  if (typeof implementation.on_operation !== "function") {
    throw new TypeError(`${"TopicStreamCallback"} is missing required method on_operation().`);
  }
  return implementation;
}

const uniffiTopicStreamCallbackRegistry = createCallbackRegistry({
  interfaceName: "TopicStreamCallback",
  validate: uniffiValidateTopicStreamCallbackImplementation,
});

function uniffiRegisterTopicStreamCallbackVtable(bindings, registrations, vtableReferences) {
  const on_eventCallback = koffi.register(
    (uniffiHandle, event, uniffiOutReturn, callStatus) => {
      const uniffiStatus = callStatus == null
        ? createRustCallStatus()
        : koffi.decode(callStatus, bindings.ffiTypes.RustCallStatus);
      const uniffiResult = invokeCallbackMethod({
        registry: uniffiTopicStreamCallbackRegistry,
        handle: uniffiHandle,
        methodName: "on_event",
        args: [
          uniffiLiftFromRustBuffer(FfiConverterStreamEvent, event),
        ],
        lowerString: (value) => uniffiLowerString(value),
        status: uniffiStatus,
      });
      if (callStatus != null) {
        koffi.encode(callStatus, bindings.ffiTypes.RustCallStatus, uniffiStatus);
      }
      if (uniffiStatus.code !== CALL_SUCCESS) {
        return;
      }
    },
    koffi.pointer(bindings.ffiCallbacks.CallbackInterfaceTopicStreamCallbackMethod0),
  );
  registrations.push(on_eventCallback);
  const on_errorCallback = koffi.register(
    (uniffiHandle, error, uniffiOutReturn, callStatus) => {
      const uniffiStatus = callStatus == null
        ? createRustCallStatus()
        : koffi.decode(callStatus, bindings.ffiTypes.RustCallStatus);
      const uniffiResult = invokeCallbackMethod({
        registry: uniffiTopicStreamCallbackRegistry,
        handle: uniffiHandle,
        methodName: "on_error",
        args: [
          uniffiLiftFromRustBuffer(FfiConverterStreamError, error),
        ],
        lowerString: (value) => uniffiLowerString(value),
        status: uniffiStatus,
      });
      if (callStatus != null) {
        koffi.encode(callStatus, bindings.ffiTypes.RustCallStatus, uniffiStatus);
      }
      if (uniffiStatus.code !== CALL_SUCCESS) {
        return;
      }
    },
    koffi.pointer(bindings.ffiCallbacks.CallbackInterfaceTopicStreamCallbackMethod1),
  );
  registrations.push(on_errorCallback);
  const on_operationCallback = koffi.register(
    (uniffiHandle, processed, source, uniffiOutReturn, callStatus) => {
      const uniffiStatus = callStatus == null
        ? createRustCallStatus()
        : koffi.decode(callStatus, bindings.ffiTypes.RustCallStatus);
      const uniffiResult = invokeCallbackMethod({
        registry: uniffiTopicStreamCallbackRegistry,
        handle: uniffiHandle,
        methodName: "on_operation",
        args: [
          uniffiProcessedOperationObjectFactory.create(processed),
          uniffiLiftFromRustBuffer(FfiConverterSource, source),
        ],
        lowerString: (value) => uniffiLowerString(value),
        status: uniffiStatus,
      });
      if (callStatus != null) {
        koffi.encode(callStatus, bindings.ffiTypes.RustCallStatus, uniffiStatus);
      }
      if (uniffiStatus.code !== CALL_SUCCESS) {
        return;
      }
    },
    koffi.pointer(bindings.ffiCallbacks.CallbackInterfaceTopicStreamCallbackMethod2),
  );
  registrations.push(on_operationCallback);
  const uniffiFree = koffi.register(
    (uniffiHandle) => uniffiTopicStreamCallbackRegistry.remove(uniffiHandle),
    koffi.pointer(bindings.ffiCallbacks.CallbackInterfaceFree),
  );
  registrations.push(uniffiFree);
  const uniffiClone = koffi.register(
    (uniffiHandle) => uniffiTopicStreamCallbackRegistry.cloneHandle(uniffiHandle),
    koffi.pointer(bindings.ffiCallbacks.CallbackInterfaceClone),
  );
  registrations.push(uniffiClone);
  const uniffiVtable = koffi.alloc(bindings.ffiStructs.VTableCallbackInterfaceTopicStreamCallback, 1);
  koffi.encode(uniffiVtable, bindings.ffiStructs.VTableCallbackInterfaceTopicStreamCallback, {
    uniffi_free: uniffiFree,
    uniffi_clone: uniffiClone,
    "on_event": on_eventCallback,
    "on_error": on_errorCallback,
    "on_operation": on_operationCallback,

  });
  vtableReferences.push(uniffiVtable);
  bindings.ffiFunctions.uniffi_p2panda_ffi_fn_init_callback_vtable_topicstreamcallback(uniffiVtable);
}

const FfiConverterTopicStreamCallback = Object.freeze({
  lower(value) {
    if (uniffiTopicStreamCallbackFactory.isInstance(value)) {
      return uniffiTopicStreamCallbackFactory.cloneHandle(value);
    }
    return uniffiTopicStreamCallbackRegistry.register(value);
  },
  lift(handle) {
    return uniffiTopicStreamCallbackFactory.create(handle);
  },
  write(value, writer) {
    writer.writeUInt64(this.lower(value));
  },
  read(reader) {
    return this.lift(reader.readUInt64());
  },
  allocationSize() {
    return UNIFFI_OBJECT_HANDLE_SIZE;
  },
});

const uniffiRegisteredCallbackPointers = [];
const uniffiRegisteredCallbackVtables = [];

function uniffiRegisterCallbackVtables(bindings) {
  uniffiRegisterEphemeralStreamCallbackVtable(bindings, uniffiRegisteredCallbackPointers, uniffiRegisteredCallbackVtables);
  uniffiRegisterTopicStreamCallbackVtable(bindings, uniffiRegisteredCallbackPointers, uniffiRegisteredCallbackVtables);
}

function uniffiUnregisterCallbackVtables() {
  clearPendingForeignFutures();
  uniffiEphemeralStreamCallbackRegistry.clear();
  uniffiTopicStreamCallbackRegistry.clear();
  while (uniffiRegisteredCallbackPointers.length > 0) {
    koffi.unregister(uniffiRegisteredCallbackPointers.pop());
  }
  uniffiRegisteredCallbackVtables.length = 0;
}

configureRuntimeHooks({
  onLoad(bindings) {
    uniffiRegisterCallbackVtables(bindings);
  },
  onUnload() {
    if (uniffiRustFutureContinuationPointer != null) {
      koffi.unregister(uniffiRustFutureContinuationPointer);
      uniffiRustFutureContinuationPointer = null;
    }
    uniffiUnregisterCallbackVtables();
  },
});

export class NodeBuilder extends UniffiObjectBase {
  constructor() {
    super();
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_nodebuilder_new(status),
      uniffiRustCallOptions(),
    );
    return uniffiNodeBuilderObjectFactory.attach(this, pointer);
  }

  ack_policy(ack_policy) {
    const loweredSelf = uniffiNodeBuilderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeBuilderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy;
    const loweredAckPolicy = uniffiLowerIntoRustBuffer(FfiConverterAckPolicy, ack_policy);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredAckPolicy, status),
      uniffiRustCallOptions(FfiConverterNodeBuilderError),
    );
  }

  bind_ip_v4(ip_address) {
    const loweredSelf = uniffiNodeBuilderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeBuilderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4;
    const loweredIpAddress = uniffiLowerString(ip_address);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredIpAddress, status),
      uniffiRustCallOptions(FfiConverterNodeBuilderError),
    );
  }

  bind_ip_v6(ip_address) {
    const loweredSelf = uniffiNodeBuilderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeBuilderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6;
    const loweredIpAddress = uniffiLowerString(ip_address);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredIpAddress, status),
      uniffiRustCallOptions(FfiConverterNodeBuilderError),
    );
  }

  bind_port_v4(port) {
    const loweredSelf = uniffiNodeBuilderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeBuilderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4;
    const loweredPort = FfiConverterUInt16.lower(port);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredPort, status),
      uniffiRustCallOptions(FfiConverterNodeBuilderError),
    );
  }

  bind_port_v6(port) {
    const loweredSelf = uniffiNodeBuilderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeBuilderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6;
    const loweredPort = FfiConverterUInt16.lower(port);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredPort, status),
      uniffiRustCallOptions(FfiConverterNodeBuilderError),
    );
  }

  bootstrap(node_id, relay_url) {
    const loweredSelf = uniffiNodeBuilderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeBuilderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap;
    const loweredNodeId = uniffiPublicKeyObjectFactory.cloneHandle(node_id);
    const loweredRelayUrl = uniffiRelayUrlObjectFactory.cloneHandle(relay_url);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredNodeId, loweredRelayUrl, status),
      uniffiRustCallOptions(FfiConverterNodeBuilderError),
    );
  }

  database_url(url) {
    const loweredSelf = uniffiNodeBuilderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeBuilderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_database_url_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_database_url;
    const loweredUrl = uniffiLowerString(url);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredUrl, status),
      uniffiRustCallOptions(FfiConverterNodeBuilderError),
    );
  }

  mdns_mode(mode) {
    const loweredSelf = uniffiNodeBuilderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeBuilderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode;
    const loweredMode = uniffiLowerIntoRustBuffer(FfiConverterMdnsDiscoveryMode, mode);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredMode, status),
      uniffiRustCallOptions(FfiConverterNodeBuilderError),
    );
  }

  network_id(network_id) {
    const loweredSelf = uniffiNodeBuilderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeBuilderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_network_id_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_network_id;
    const loweredNetworkId = uniffiNetworkIdObjectFactory.cloneHandle(network_id);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredNetworkId, status),
      uniffiRustCallOptions(FfiConverterNodeBuilderError),
    );
  }

  private_key(private_key) {
    const loweredSelf = uniffiNodeBuilderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeBuilderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_private_key_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_private_key;
    const loweredPrivateKey = uniffiPrivateKeyObjectFactory.cloneHandle(private_key);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredPrivateKey, status),
      uniffiRustCallOptions(FfiConverterNodeBuilderError),
    );
  }

  relay_url(url) {
    const loweredSelf = uniffiNodeBuilderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeBuilderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url;
    const loweredUrl = uniffiRelayUrlObjectFactory.cloneHandle(url);
    uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredUrl, status),
      uniffiRustCallOptions(FfiConverterNodeBuilderError),
    );
  }

  async spawn() {
    const loweredSelf = uniffiNodeBuilderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeBuilderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_spawn_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_spawn;
    const completePointer = uniffiGetCachedLibraryFunction(
      "complete:ffi_p2panda_ffi_rust_future_complete_u64",
      (bindings) => bindings.library.func(
        "ffi_p2panda_ffi_rust_future_complete_u64",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.UniffiHandle, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    const completeFunc = (rustFuture, status) => completePointer(rustFuture, status);
    return rustCallAsync({
      rustFutureFunc: () => ffiMethod(loweredSelf),
      pollFunc: (rustFuture, _continuationCallback, continuationHandle) => ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u64(rustFuture, uniffiGetRustFutureContinuationPointer(), continuationHandle),
      cancelFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u64(rustFuture),
      completeFunc,
      freeFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_free_u64(rustFuture),
      liftFunc: (uniffiResult) => uniffiNodeObjectFactory.createRawExternal(uniffiResult),
      ...uniffiRustCallOptions(FfiConverterSpawnError),
    });
  }
}

const uniffiNodeBuilderObjectFactory = createObjectFactory({
  typeName: "NodeBuilder",
  createInstance: () => Object.create(NodeBuilder.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_nodebuilder_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_nodebuilder:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_nodebuilder",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_nodebuilder(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_nodebuilder_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_nodebuilder:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_nodebuilder",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_nodebuilder(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterNodeBuilder = createObjectConverter(uniffiNodeBuilderObjectFactory);

export class Cursor extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("Cursor.constructor");
  }

  name() {
    const loweredSelf = uniffiCursorObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiCursorObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_cursor_name_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_cursor_name;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftStringFromRustBuffer(uniffiResult);
  }
}

const uniffiCursorObjectFactory = createObjectFactory({
  typeName: "Cursor",
  createInstance: () => Object.create(Cursor.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_cursor_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_cursor:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_cursor",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_cursor(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_cursor_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_cursor:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_cursor",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_cursor(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterCursor = createObjectConverter(uniffiCursorObjectFactory);

export class Hash extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("Hash.constructor");
  }

  static digest(value) {
    const loweredValue = uniffiLowerIntoRustBuffer(FfiConverterBytes, value);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_hash_digest(loweredValue, status),
      uniffiRustCallOptions(),
    );
    return uniffiHashObjectFactory.create(pointer);
  }

  static from_bytes(value) {
    const loweredValue = uniffiLowerIntoRustBuffer(FfiConverterBytes, value);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_hash_from_bytes(loweredValue, status),
      uniffiRustCallOptions(FfiConverterConversionError),
    );
    return uniffiHashObjectFactory.create(pointer);
  }

  static from_hex(value) {
    const loweredValue = uniffiLowerString(value);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_hash_from_hex(loweredValue, status),
      uniffiRustCallOptions(FfiConverterConversionError),
    );
    return uniffiHashObjectFactory.create(pointer);
  }

  to_bytes() {
    const loweredSelf = uniffiHashObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiHashObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_hash_to_bytes_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_hash_to_bytes;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftFromRustBuffer(FfiConverterBytes, uniffiResult);
  }

  to_hex() {
    const loweredSelf = uniffiHashObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiHashObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_hash_to_hex_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_hash_to_hex;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftStringFromRustBuffer(uniffiResult);
  }
}

const uniffiHashObjectFactory = createObjectFactory({
  typeName: "Hash",
  createInstance: () => Object.create(Hash.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_hash_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_hash:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_hash",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_hash(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_hash_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_hash:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_hash",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_hash(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterHash = createObjectConverter(uniffiHashObjectFactory);

export class Header extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("Header.constructor");
  }

  backlink() {
    const loweredSelf = uniffiHeaderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiHeaderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_header_backlink_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_header_backlink;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftFromRustBuffer(uniffiOptionalConverter(FfiConverterHash), uniffiResult);
  }

  hash() {
    const loweredSelf = uniffiHeaderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiHeaderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_header_hash_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_header_hash;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiHashObjectFactory.create(uniffiResult);
  }

  log_id() {
    const loweredSelf = uniffiHeaderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiHeaderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_header_log_id_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_header_log_id;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiHashObjectFactory.create(uniffiResult);
  }

  payload_hash() {
    const loweredSelf = uniffiHeaderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiHeaderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_header_payload_hash_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_header_payload_hash;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiHashObjectFactory.create(uniffiResult);
  }

  payload_size() {
    const loweredSelf = uniffiHeaderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiHeaderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_header_payload_size_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_header_payload_size;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return FfiConverterUInt64.lift(uniffiResult);
  }

  prune_flag() {
    const loweredSelf = uniffiHeaderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiHeaderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_header_prune_flag_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_header_prune_flag;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return FfiConverterBool.lift(uniffiResult);
  }

  public_key() {
    const loweredSelf = uniffiHeaderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiHeaderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_header_public_key_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_header_public_key;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiPublicKeyObjectFactory.create(uniffiResult);
  }

  seq_num() {
    const loweredSelf = uniffiHeaderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiHeaderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_header_seq_num_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_header_seq_num;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return FfiConverterUInt64.lift(uniffiResult);
  }

  signature() {
    const loweredSelf = uniffiHeaderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiHeaderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_header_signature_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_header_signature;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiSignatureObjectFactory.create(uniffiResult);
  }

  timestamp() {
    const loweredSelf = uniffiHeaderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiHeaderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_header_timestamp_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_header_timestamp;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return FfiConverterUInt64.lift(uniffiResult);
  }

  version() {
    const loweredSelf = uniffiHeaderObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiHeaderObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_header_version_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_header_version;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return FfiConverterUInt64.lift(uniffiResult);
  }
}

const uniffiHeaderObjectFactory = createObjectFactory({
  typeName: "Header",
  createInstance: () => Object.create(Header.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_header_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_header:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_header",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_header(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_header_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_header:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_header",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_header(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterHeader = createObjectConverter(uniffiHeaderObjectFactory);

export class NetworkId extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("NetworkId.constructor");
  }

  static from_bytes(value) {
    const loweredValue = uniffiLowerIntoRustBuffer(FfiConverterBytes, value);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_networkid_from_bytes(loweredValue, status),
      uniffiRustCallOptions(FfiConverterConversionError),
    );
    return uniffiNetworkIdObjectFactory.create(pointer);
  }

  static from_hash(hash) {
    const loweredHash = uniffiHashObjectFactory.cloneHandle(hash);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_networkid_from_hash(loweredHash, status),
      uniffiRustCallOptions(),
    );
    return uniffiNetworkIdObjectFactory.create(pointer);
  }

  static from_hex(value) {
    const loweredValue = uniffiLowerString(value);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_networkid_from_hex(loweredValue, status),
      uniffiRustCallOptions(FfiConverterConversionError),
    );
    return uniffiNetworkIdObjectFactory.create(pointer);
  }

  static random() {
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_networkid_random(status),
      uniffiRustCallOptions(),
    );
    return uniffiNetworkIdObjectFactory.create(pointer);
  }

  to_bytes() {
    const loweredSelf = uniffiNetworkIdObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNetworkIdObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_networkid_to_bytes_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_networkid_to_bytes;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftFromRustBuffer(FfiConverterBytes, uniffiResult);
  }

  to_hex() {
    const loweredSelf = uniffiNetworkIdObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNetworkIdObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_networkid_to_hex_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_networkid_to_hex;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftStringFromRustBuffer(uniffiResult);
  }
}

const uniffiNetworkIdObjectFactory = createObjectFactory({
  typeName: "NetworkId",
  createInstance: () => Object.create(NetworkId.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_networkid_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_networkid:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_networkid",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_networkid(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_networkid_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_networkid:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_networkid",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_networkid(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterNetworkId = createObjectConverter(uniffiNetworkIdObjectFactory);

export class PrivateKey extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("PrivateKey.constructor");
  }

  static from_bytes(value) {
    const loweredValue = uniffiLowerIntoRustBuffer(FfiConverterBytes, value);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_privatekey_from_bytes(loweredValue, status),
      uniffiRustCallOptions(FfiConverterConversionError),
    );
    return uniffiPrivateKeyObjectFactory.create(pointer);
  }

  static from_hex(value) {
    const loweredValue = uniffiLowerString(value);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_privatekey_from_hex(loweredValue, status),
      uniffiRustCallOptions(FfiConverterConversionError),
    );
    return uniffiPrivateKeyObjectFactory.create(pointer);
  }

  static generate() {
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_privatekey_generate(status),
      uniffiRustCallOptions(),
    );
    return uniffiPrivateKeyObjectFactory.create(pointer);
  }

  public_key() {
    const loweredSelf = uniffiPrivateKeyObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiPrivateKeyObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_public_key_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_public_key;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiPublicKeyObjectFactory.create(uniffiResult);
  }

  sign(bytes) {
    const loweredSelf = uniffiPrivateKeyObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiPrivateKeyObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_sign_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_sign;
    const loweredBytes = uniffiLowerIntoRustBuffer(FfiConverterBytes, bytes);
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredBytes, status),
      uniffiRustCallOptions(),
    );
    return uniffiSignatureObjectFactory.create(uniffiResult);
  }

  to_bytes() {
    const loweredSelf = uniffiPrivateKeyObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiPrivateKeyObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_to_bytes_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_to_bytes;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftFromRustBuffer(FfiConverterBytes, uniffiResult);
  }

  to_hex() {
    const loweredSelf = uniffiPrivateKeyObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiPrivateKeyObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_to_hex_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_to_hex;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftStringFromRustBuffer(uniffiResult);
  }
}

const uniffiPrivateKeyObjectFactory = createObjectFactory({
  typeName: "PrivateKey",
  createInstance: () => Object.create(PrivateKey.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_privatekey_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_privatekey:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_privatekey",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_privatekey(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_privatekey_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_privatekey:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_privatekey",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_privatekey(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterPrivateKey = createObjectConverter(uniffiPrivateKeyObjectFactory);

export class PublicKey extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("PublicKey.constructor");
  }

  static from_bytes(value) {
    const loweredValue = uniffiLowerIntoRustBuffer(FfiConverterBytes, value);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_publickey_from_bytes(loweredValue, status),
      uniffiRustCallOptions(FfiConverterConversionError),
    );
    return uniffiPublicKeyObjectFactory.create(pointer);
  }

  static from_hex(value) {
    const loweredValue = uniffiLowerString(value);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_publickey_from_hex(loweredValue, status),
      uniffiRustCallOptions(FfiConverterConversionError),
    );
    return uniffiPublicKeyObjectFactory.create(pointer);
  }

  to_bytes() {
    const loweredSelf = uniffiPublicKeyObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiPublicKeyObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_publickey_to_bytes_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_publickey_to_bytes;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftFromRustBuffer(FfiConverterBytes, uniffiResult);
  }

  to_hex() {
    const loweredSelf = uniffiPublicKeyObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiPublicKeyObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_publickey_to_hex_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_publickey_to_hex;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftStringFromRustBuffer(uniffiResult);
  }

  verify(bytes, signature) {
    const loweredSelf = uniffiPublicKeyObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiPublicKeyObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_publickey_verify_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_publickey_verify;
    const loweredBytes = uniffiLowerIntoRustBuffer(FfiConverterBytes, bytes);
    const loweredSignature = uniffiSignatureObjectFactory.cloneHandle(signature);
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, loweredBytes, loweredSignature, status),
      uniffiRustCallOptions(),
    );
    return FfiConverterBool.lift(uniffiResult);
  }
}

const uniffiPublicKeyObjectFactory = createObjectFactory({
  typeName: "PublicKey",
  createInstance: () => Object.create(PublicKey.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_publickey_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_publickey:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_publickey",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_publickey(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_publickey_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_publickey:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_publickey",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_publickey(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterPublicKey = createObjectConverter(uniffiPublicKeyObjectFactory);

export class RelayUrl extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("RelayUrl.constructor");
  }

  static from_str(value) {
    const loweredValue = uniffiLowerString(value);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_relayurl_from_str(loweredValue, status),
      uniffiRustCallOptions(FfiConverterRelayUrlParseError),
    );
    return uniffiRelayUrlObjectFactory.create(pointer);
  }

  to_str() {
    const loweredSelf = uniffiRelayUrlObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiRelayUrlObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_relayurl_to_str_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_relayurl_to_str;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftStringFromRustBuffer(uniffiResult);
  }
}

const uniffiRelayUrlObjectFactory = createObjectFactory({
  typeName: "RelayUrl",
  createInstance: () => Object.create(RelayUrl.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_relayurl_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_relayurl:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_relayurl",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_relayurl(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_relayurl_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_relayurl:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_relayurl",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_relayurl(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterRelayUrl = createObjectConverter(uniffiRelayUrlObjectFactory);

export class Signature extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("Signature.constructor");
  }

  static from_bytes(value) {
    const loweredValue = uniffiLowerIntoRustBuffer(FfiConverterBytes, value);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_signature_from_bytes(loweredValue, status),
      uniffiRustCallOptions(FfiConverterConversionError),
    );
    return uniffiSignatureObjectFactory.create(pointer);
  }

  static from_hex(value) {
    const loweredValue = uniffiLowerString(value);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_signature_from_hex(loweredValue, status),
      uniffiRustCallOptions(FfiConverterConversionError),
    );
    return uniffiSignatureObjectFactory.create(pointer);
  }

  to_bytes() {
    const loweredSelf = uniffiSignatureObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiSignatureObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_signature_to_bytes_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_signature_to_bytes;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftFromRustBuffer(FfiConverterBytes, uniffiResult);
  }

  to_hex() {
    const loweredSelf = uniffiSignatureObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiSignatureObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_signature_to_hex_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_signature_to_hex;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftStringFromRustBuffer(uniffiResult);
  }
}

const uniffiSignatureObjectFactory = createObjectFactory({
  typeName: "Signature",
  createInstance: () => Object.create(Signature.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_signature_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_signature:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_signature",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_signature(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_signature_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_signature:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_signature",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_signature(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterSignature = createObjectConverter(uniffiSignatureObjectFactory);

export class TopicId extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("TopicId.constructor");
  }

  static from_bytes(value) {
    const loweredValue = uniffiLowerIntoRustBuffer(FfiConverterBytes, value);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_topicid_from_bytes(loweredValue, status),
      uniffiRustCallOptions(FfiConverterConversionError),
    );
    return uniffiTopicIdObjectFactory.create(pointer);
  }

  static from_hash(hash) {
    const loweredHash = uniffiHashObjectFactory.cloneHandle(hash);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_topicid_from_hash(loweredHash, status),
      uniffiRustCallOptions(),
    );
    return uniffiTopicIdObjectFactory.create(pointer);
  }

  static from_hex(value) {
    const loweredValue = uniffiLowerString(value);
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_topicid_from_hex(loweredValue, status),
      uniffiRustCallOptions(FfiConverterConversionError),
    );
    return uniffiTopicIdObjectFactory.create(pointer);
  }

  static random() {
    const pointer = uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_topicid_random(status),
      uniffiRustCallOptions(),
    );
    return uniffiTopicIdObjectFactory.create(pointer);
  }

  to_bytes() {
    const loweredSelf = uniffiTopicIdObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiTopicIdObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_topicid_to_bytes_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_topicid_to_bytes;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftFromRustBuffer(FfiConverterBytes, uniffiResult);
  }

  to_hex() {
    const loweredSelf = uniffiTopicIdObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiTopicIdObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_topicid_to_hex_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_topicid_to_hex;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftStringFromRustBuffer(uniffiResult);
  }
}

const uniffiTopicIdObjectFactory = createObjectFactory({
  typeName: "TopicId",
  createInstance: () => Object.create(TopicId.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_topicid_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_topicid:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_topicid",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_topicid(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_topicid_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_topicid:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_topicid",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_topicid(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterTopicId = createObjectConverter(uniffiTopicIdObjectFactory);

export class EphemeralMessage extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("EphemeralMessage.constructor");
  }

  author() {
    const loweredSelf = uniffiEphemeralMessageObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiEphemeralMessageObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_author_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_author;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiPublicKeyObjectFactory.create(uniffiResult);
  }

  body() {
    const loweredSelf = uniffiEphemeralMessageObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiEphemeralMessageObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_body_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_body;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftFromRustBuffer(FfiConverterBytes, uniffiResult);
  }

  timestamp() {
    const loweredSelf = uniffiEphemeralMessageObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiEphemeralMessageObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return FfiConverterUInt64.lift(uniffiResult);
  }

  topic() {
    const loweredSelf = uniffiEphemeralMessageObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiEphemeralMessageObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiTopicIdObjectFactory.create(uniffiResult);
  }
}

const uniffiEphemeralMessageObjectFactory = createObjectFactory({
  typeName: "EphemeralMessage",
  createInstance: () => Object.create(EphemeralMessage.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_ephemeralmessage_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_ephemeralmessage:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_ephemeralmessage",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_ephemeralmessage(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_ephemeralmessage_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_ephemeralmessage:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_ephemeralmessage",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_ephemeralmessage(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterEphemeralMessage = createObjectConverter(uniffiEphemeralMessageObjectFactory);

export class EphemeralStream extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("EphemeralStream.constructor");
  }

  async publish(message) {
    const loweredSelf = uniffiEphemeralStreamObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiEphemeralStreamObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralstream_publish_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralstream_publish;
    const loweredMessage = uniffiLowerIntoRustBuffer(FfiConverterBytes, message);
    const completeFunc = (rustFuture, status) => ffiFunctions.ffi_p2panda_ffi_rust_future_complete_void(rustFuture, status);
    return rustCallAsync({
      rustFutureFunc: () => ffiMethod(loweredSelf, loweredMessage),
      pollFunc: (rustFuture, _continuationCallback, continuationHandle) => ffiFunctions.ffi_p2panda_ffi_rust_future_poll_void(rustFuture, uniffiGetRustFutureContinuationPointer(), continuationHandle),
      cancelFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_void(rustFuture),
      completeFunc,
      freeFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_free_void(rustFuture),
      liftFunc: (_uniffiResult) => undefined,
      ...uniffiRustCallOptions(FfiConverterEphemeralPublishError),
    });
  }

  topic() {
    const loweredSelf = uniffiEphemeralStreamObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiEphemeralStreamObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralstream_topic_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralstream_topic;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiTopicIdObjectFactory.create(uniffiResult);
  }
}

const uniffiEphemeralStreamObjectFactory = createObjectFactory({
  typeName: "EphemeralStream",
  createInstance: () => Object.create(EphemeralStream.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_ephemeralstream_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_ephemeralstream:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_ephemeralstream",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_ephemeralstream(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_ephemeralstream_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_ephemeralstream:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_ephemeralstream",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_ephemeralstream(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterEphemeralStream = createObjectConverter(uniffiEphemeralStreamObjectFactory);

export class Node extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("Node.constructor");
  }

  static async spawn() {
    const completePointer = uniffiGetCachedLibraryFunction(
      "complete:ffi_p2panda_ffi_rust_future_complete_u64",
      (bindings) => bindings.library.func(
        "ffi_p2panda_ffi_rust_future_complete_u64",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.UniffiHandle, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    const completeFunc = (rustFuture, status) => completePointer(rustFuture, status);
    return rustCallAsync({
      rustFutureFunc: () => ffiFunctions.uniffi_p2panda_ffi_fn_constructor_node_spawn(),
      pollFunc: (rustFuture, _continuationCallback, continuationHandle) => ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u64(rustFuture, uniffiGetRustFutureContinuationPointer(), continuationHandle),
      cancelFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u64(rustFuture),
      freeFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_free_u64(rustFuture),
      completeFunc,
      liftFunc: (pointer) => uniffiNodeObjectFactory.createRawExternal(pointer),
      ...uniffiRustCallOptions(FfiConverterSpawnError),
    });
  }

  async ephemeral_stream(topic, on_message) {
    const loweredSelf = uniffiNodeObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_node_ephemeral_stream_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_node_ephemeral_stream;
    const loweredTopic = uniffiTopicIdObjectFactory.cloneHandle(topic);
    const loweredOnMessage = FfiConverterEphemeralStreamCallback.lower(on_message);
    const completePointer = uniffiGetCachedLibraryFunction(
      "complete:ffi_p2panda_ffi_rust_future_complete_u64",
      (bindings) => bindings.library.func(
        "ffi_p2panda_ffi_rust_future_complete_u64",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.UniffiHandle, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    const completeFunc = (rustFuture, status) => completePointer(rustFuture, status);
    return rustCallAsync({
      rustFutureFunc: () => ffiMethod(loweredSelf, loweredTopic, loweredOnMessage),
      pollFunc: (rustFuture, _continuationCallback, continuationHandle) => ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u64(rustFuture, uniffiGetRustFutureContinuationPointer(), continuationHandle),
      cancelFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u64(rustFuture),
      completeFunc,
      freeFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_free_u64(rustFuture),
      liftFunc: (uniffiResult) => uniffiEphemeralStreamObjectFactory.createRawExternal(uniffiResult),
      ...uniffiRustCallOptions(FfiConverterCreateStreamError),
    });
  }

  id() {
    const loweredSelf = uniffiNodeObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_node_id_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_node_id;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiPublicKeyObjectFactory.create(uniffiResult);
  }

  async insert_bootstrap(node_id, relay_url) {
    const loweredSelf = uniffiNodeObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_node_insert_bootstrap_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_node_insert_bootstrap;
    const loweredNodeId = uniffiPublicKeyObjectFactory.cloneHandle(node_id);
    const loweredRelayUrl = uniffiRelayUrlObjectFactory.cloneHandle(relay_url);
    const completeFunc = (rustFuture, status) => ffiFunctions.ffi_p2panda_ffi_rust_future_complete_void(rustFuture, status);
    return rustCallAsync({
      rustFutureFunc: () => ffiMethod(loweredSelf, loweredNodeId, loweredRelayUrl),
      pollFunc: (rustFuture, _continuationCallback, continuationHandle) => ffiFunctions.ffi_p2panda_ffi_rust_future_poll_void(rustFuture, uniffiGetRustFutureContinuationPointer(), continuationHandle),
      cancelFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_void(rustFuture),
      completeFunc,
      freeFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_free_void(rustFuture),
      liftFunc: (_uniffiResult) => undefined,
      ...uniffiRustCallOptions(FfiConverterNetworkError),
    });
  }

  network_id() {
    const loweredSelf = uniffiNodeObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_node_network_id_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_node_network_id;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiNetworkIdObjectFactory.create(uniffiResult);
  }

  async stream(topic, callback) {
    const loweredSelf = uniffiNodeObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_node_stream_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_node_stream;
    const loweredTopic = uniffiTopicIdObjectFactory.cloneHandle(topic);
    const loweredCallback = FfiConverterTopicStreamCallback.lower(callback);
    const completePointer = uniffiGetCachedLibraryFunction(
      "complete:ffi_p2panda_ffi_rust_future_complete_u64",
      (bindings) => bindings.library.func(
        "ffi_p2panda_ffi_rust_future_complete_u64",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.UniffiHandle, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    const completeFunc = (rustFuture, status) => completePointer(rustFuture, status);
    return rustCallAsync({
      rustFutureFunc: () => ffiMethod(loweredSelf, loweredTopic, loweredCallback),
      pollFunc: (rustFuture, _continuationCallback, continuationHandle) => ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u64(rustFuture, uniffiGetRustFutureContinuationPointer(), continuationHandle),
      cancelFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u64(rustFuture),
      completeFunc,
      freeFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_free_u64(rustFuture),
      liftFunc: (uniffiResult) => uniffiTopicStreamObjectFactory.createRawExternal(uniffiResult),
      ...uniffiRustCallOptions(FfiConverterCreateStreamError),
    });
  }

  async stream_from(topic, from, callback) {
    const loweredSelf = uniffiNodeObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiNodeObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_node_stream_from_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_node_stream_from;
    const loweredTopic = uniffiTopicIdObjectFactory.cloneHandle(topic);
    const loweredFrom = uniffiLowerIntoRustBuffer(FfiConverterStreamFrom, from);
    const loweredCallback = FfiConverterTopicStreamCallback.lower(callback);
    const completePointer = uniffiGetCachedLibraryFunction(
      "complete:ffi_p2panda_ffi_rust_future_complete_u64",
      (bindings) => bindings.library.func(
        "ffi_p2panda_ffi_rust_future_complete_u64",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.UniffiHandle, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    const completeFunc = (rustFuture, status) => completePointer(rustFuture, status);
    return rustCallAsync({
      rustFutureFunc: () => ffiMethod(loweredSelf, loweredTopic, loweredFrom, loweredCallback),
      pollFunc: (rustFuture, _continuationCallback, continuationHandle) => ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u64(rustFuture, uniffiGetRustFutureContinuationPointer(), continuationHandle),
      cancelFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u64(rustFuture),
      completeFunc,
      freeFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_free_u64(rustFuture),
      liftFunc: (uniffiResult) => uniffiTopicStreamObjectFactory.createRawExternal(uniffiResult),
      ...uniffiRustCallOptions(FfiConverterCreateStreamError),
    });
  }
}

const uniffiNodeObjectFactory = createObjectFactory({
  typeName: "Node",
  createInstance: () => Object.create(Node.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_node_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_node:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_node",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_node(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_node_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_node:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_node",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_node(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterNode = createObjectConverter(uniffiNodeObjectFactory);

export class Event extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("Event.constructor");
  }

  body() {
    const loweredSelf = uniffiEventObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiEventObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_event_body_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_event_body;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftFromRustBuffer(uniffiOptionalConverter(FfiConverterBytes), uniffiResult);
  }

  header() {
    const loweredSelf = uniffiEventObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiEventObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_event_header_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_event_header;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiHeaderObjectFactory.create(uniffiResult);
  }

  is_completed() {
    const loweredSelf = uniffiEventObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiEventObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_event_is_completed_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_event_is_completed;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return FfiConverterBool.lift(uniffiResult);
  }

  is_failed() {
    const loweredSelf = uniffiEventObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiEventObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_event_is_failed_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_event_is_failed;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return FfiConverterBool.lift(uniffiResult);
  }
}

const uniffiEventObjectFactory = createObjectFactory({
  typeName: "Event",
  createInstance: () => Object.create(Event.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_event_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_event:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_event",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_event(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_event_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_event:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_event",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_event(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterEvent = createObjectConverter(uniffiEventObjectFactory);

export class ProcessedOperation extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("ProcessedOperation.constructor");
  }

  async ack() {
    const loweredSelf = uniffiProcessedOperationObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiProcessedOperationObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_ack_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_ack;
    const completeFunc = (rustFuture, status) => ffiFunctions.ffi_p2panda_ffi_rust_future_complete_void(rustFuture, status);
    return rustCallAsync({
      rustFutureFunc: () => ffiMethod(loweredSelf),
      pollFunc: (rustFuture, _continuationCallback, continuationHandle) => ffiFunctions.ffi_p2panda_ffi_rust_future_poll_void(rustFuture, uniffiGetRustFutureContinuationPointer(), continuationHandle),
      cancelFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_void(rustFuture),
      completeFunc,
      freeFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_free_void(rustFuture),
      liftFunc: (_uniffiResult) => undefined,
      ...uniffiRustCallOptions(FfiConverterAckedError),
    });
  }

  author() {
    const loweredSelf = uniffiProcessedOperationObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiProcessedOperationObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_author_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_author;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiPublicKeyObjectFactory.create(uniffiResult);
  }

  id() {
    const loweredSelf = uniffiProcessedOperationObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiProcessedOperationObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_id_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_id;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiHashObjectFactory.create(uniffiResult);
  }

  message() {
    const loweredSelf = uniffiProcessedOperationObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiProcessedOperationObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_message_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_message;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiLiftFromRustBuffer(FfiConverterBytes, uniffiResult);
  }

  processed() {
    const loweredSelf = uniffiProcessedOperationObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiProcessedOperationObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_processed_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_processed;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiEventObjectFactory.create(uniffiResult);
  }

  timestamp() {
    const loweredSelf = uniffiProcessedOperationObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiProcessedOperationObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_timestamp_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_timestamp;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return FfiConverterUInt64.lift(uniffiResult);
  }

  topic() {
    const loweredSelf = uniffiProcessedOperationObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiProcessedOperationObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_topic_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_topic;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiTopicIdObjectFactory.create(uniffiResult);
  }
}

const uniffiProcessedOperationObjectFactory = createObjectFactory({
  typeName: "ProcessedOperation",
  createInstance: () => Object.create(ProcessedOperation.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_processedoperation_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_processedoperation:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_processedoperation",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_processedoperation(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_processedoperation_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_processedoperation:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_processedoperation",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_processedoperation(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterProcessedOperation = createObjectConverter(uniffiProcessedOperationObjectFactory);

export class TopicStream extends UniffiObjectBase {
  constructor() {
    super();
    return uniffiNotImplemented("TopicStream.constructor");
  }

  async ack(message_id) {
    const loweredSelf = uniffiTopicStreamObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiTopicStreamObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_ack_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_ack;
    const loweredMessageId = uniffiHashObjectFactory.cloneHandle(message_id);
    const completeFunc = (rustFuture, status) => ffiFunctions.ffi_p2panda_ffi_rust_future_complete_void(rustFuture, status);
    return rustCallAsync({
      rustFutureFunc: () => ffiMethod(loweredSelf, loweredMessageId),
      pollFunc: (rustFuture, _continuationCallback, continuationHandle) => ffiFunctions.ffi_p2panda_ffi_rust_future_poll_void(rustFuture, uniffiGetRustFutureContinuationPointer(), continuationHandle),
      cancelFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_void(rustFuture),
      completeFunc,
      freeFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_free_void(rustFuture),
      liftFunc: (_uniffiResult) => undefined,
      ...uniffiRustCallOptions(FfiConverterAckedError),
    });
  }

  async prune(message) {
    const loweredSelf = uniffiTopicStreamObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiTopicStreamObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_prune_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_prune;
    const loweredMessage = uniffiLowerIntoRustBuffer(uniffiOptionalConverter(FfiConverterBytes), message);
    const completePointer = uniffiGetCachedLibraryFunction(
      "complete:ffi_p2panda_ffi_rust_future_complete_u64",
      (bindings) => bindings.library.func(
        "ffi_p2panda_ffi_rust_future_complete_u64",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.UniffiHandle, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    const completeFunc = (rustFuture, status) => completePointer(rustFuture, status);
    return rustCallAsync({
      rustFutureFunc: () => ffiMethod(loweredSelf, loweredMessage),
      pollFunc: (rustFuture, _continuationCallback, continuationHandle) => ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u64(rustFuture, uniffiGetRustFutureContinuationPointer(), continuationHandle),
      cancelFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u64(rustFuture),
      completeFunc,
      freeFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_free_u64(rustFuture),
      liftFunc: (uniffiResult) => uniffiHashObjectFactory.createRawExternal(uniffiResult),
      ...uniffiRustCallOptions(FfiConverterPublishError),
    });
  }

  async publish(message) {
    const loweredSelf = uniffiTopicStreamObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiTopicStreamObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_publish_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_publish;
    const loweredMessage = uniffiLowerIntoRustBuffer(FfiConverterBytes, message);
    const completePointer = uniffiGetCachedLibraryFunction(
      "complete:ffi_p2panda_ffi_rust_future_complete_u64",
      (bindings) => bindings.library.func(
        "ffi_p2panda_ffi_rust_future_complete_u64",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.UniffiHandle, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    const completeFunc = (rustFuture, status) => completePointer(rustFuture, status);
    return rustCallAsync({
      rustFutureFunc: () => ffiMethod(loweredSelf, loweredMessage),
      pollFunc: (rustFuture, _continuationCallback, continuationHandle) => ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u64(rustFuture, uniffiGetRustFutureContinuationPointer(), continuationHandle),
      cancelFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u64(rustFuture),
      completeFunc,
      freeFunc: (rustFuture) => ffiFunctions.ffi_p2panda_ffi_rust_future_free_u64(rustFuture),
      liftFunc: (uniffiResult) => uniffiHashObjectFactory.createRawExternal(uniffiResult),
      ...uniffiRustCallOptions(FfiConverterPublishError),
    });
  }

  topic() {
    const loweredSelf = uniffiTopicStreamObjectFactory.cloneHandle(this);
    const ffiMethod =
      uniffiTopicStreamObjectFactory.usesGenericAbi(this)
        ? ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_topic_generic_abi
        : ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_topic;
    const uniffiResult = uniffiRustCaller.rustCall(
      (status) => ffiMethod(loweredSelf, status),
      uniffiRustCallOptions(),
    );
    return uniffiTopicIdObjectFactory.create(uniffiResult);
  }
}

const uniffiTopicStreamObjectFactory = createObjectFactory({
  typeName: "TopicStream",
  createInstance: () => Object.create(TopicStream.prototype),
  cloneFreeUsesUniffiHandle: true,
  cloneHandleGeneric(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_topicstream_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandleRawExternal(handle) {
    const rawExternalCloneHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_clone_topicstream:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_clone_topicstream",
        bindings.ffiTypes.VoidPointer,
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    return uniffiRustCaller.rustCall(
      (status) => rawExternalCloneHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  cloneHandle(handle) {
    return uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_clone_topicstream(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleGeneric(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_topicstream_generic_abi(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandleRawExternal(handle) {
    const rawExternalFreeHandle = uniffiGetCachedLibraryFunction(
      "uniffi_p2panda_ffi_fn_free_topicstream:raw-external",
      (bindings) => bindings.library.func(
        "uniffi_p2panda_ffi_fn_free_topicstream",
        "void",
        [bindings.ffiTypes.VoidPointer, koffi.pointer(bindings.ffiTypes.RustCallStatus)],
      ),
    );
    uniffiRustCaller.rustCall(
      (status) => rawExternalFreeHandle(handle, status),
      uniffiRustCallOptions(),
    );
  },
  freeHandle(handle) {
    uniffiRustCaller.rustCall(
      (status) => ffiFunctions.uniffi_p2panda_ffi_fn_free_topicstream(handle, status),
      uniffiRustCallOptions(),
    );
  },
});
const FfiConverterTopicStream = createObjectConverter(uniffiTopicStreamObjectFactory);