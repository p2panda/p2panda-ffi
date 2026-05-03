import { existsSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import koffi from "koffi";
import {
  ForeignBytes,
  RustBuffer,
  RustCallStatus,
  defineCallbackPrototype,
  UniffiHandle,
  VoidPointer,
  defineCallbackVtable,
  defineStructType,
  normalizeHandle,
  normalizeInt64,
  normalizeRustBuffer,
  normalizeRustCallStatus,
  normalizeUInt64,
} from "./runtime/ffi-types.js";
import {
  ChecksumMismatchError,
  ContractVersionMismatchError,
  LibraryNotLoadedError,
} from "./runtime/errors.js";

export const ffiMetadata = Object.freeze({
  namespace: "p2panda_ffi",
  cdylibName: "p2panda_ffi",
  stagedLibraryPackageRelativePath: "libp2panda_ffi.so",
  bundledPrebuilds: false,
  manualLoad: false,
});

export const ffiIntegrity = Object.freeze({
  contractVersionFunction: "ffi_p2panda_ffi_uniffi_contract_version",
  expectedContractVersion: 30,
  checksums: Object.freeze({

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy": 19922,

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4": 13056,

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6": 60847,

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4": 19546,

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6": 43790,

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap": 42251,

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url": 57213,

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode": 56351,

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id": 25341,

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key": 55001,

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url": 60407,

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn": 44540,

    "uniffi_p2panda_ffi_checksum_method_cursor_name": 43705,

    "uniffi_p2panda_ffi_checksum_method_hash_to_bytes": 61881,

    "uniffi_p2panda_ffi_checksum_method_hash_to_hex": 52106,

    "uniffi_p2panda_ffi_checksum_method_header_backlink": 19728,

    "uniffi_p2panda_ffi_checksum_method_header_hash": 328,

    "uniffi_p2panda_ffi_checksum_method_header_log_id": 13882,

    "uniffi_p2panda_ffi_checksum_method_header_payload_hash": 46060,

    "uniffi_p2panda_ffi_checksum_method_header_payload_size": 63083,

    "uniffi_p2panda_ffi_checksum_method_header_prune_flag": 18333,

    "uniffi_p2panda_ffi_checksum_method_header_public_key": 13290,

    "uniffi_p2panda_ffi_checksum_method_header_seq_num": 41915,

    "uniffi_p2panda_ffi_checksum_method_header_signature": 51488,

    "uniffi_p2panda_ffi_checksum_method_header_timestamp": 468,

    "uniffi_p2panda_ffi_checksum_method_header_version": 39499,

    "uniffi_p2panda_ffi_checksum_method_networkid_to_bytes": 64224,

    "uniffi_p2panda_ffi_checksum_method_networkid_to_hex": 62120,

    "uniffi_p2panda_ffi_checksum_method_privatekey_public_key": 36762,

    "uniffi_p2panda_ffi_checksum_method_privatekey_sign": 16842,

    "uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes": 28452,

    "uniffi_p2panda_ffi_checksum_method_privatekey_to_hex": 34482,

    "uniffi_p2panda_ffi_checksum_method_publickey_to_bytes": 23757,

    "uniffi_p2panda_ffi_checksum_method_publickey_to_hex": 31307,

    "uniffi_p2panda_ffi_checksum_method_publickey_verify": 27867,

    "uniffi_p2panda_ffi_checksum_method_relayurl_to_str": 47854,

    "uniffi_p2panda_ffi_checksum_method_signature_to_bytes": 50852,

    "uniffi_p2panda_ffi_checksum_method_signature_to_hex": 43786,

    "uniffi_p2panda_ffi_checksum_method_topicid_to_bytes": 63194,

    "uniffi_p2panda_ffi_checksum_method_topicid_to_hex": 29111,

    "uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author": 52355,

    "uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body": 33930,

    "uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp": 55567,

    "uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic": 61410,

    "uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish": 48773,

    "uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic": 11085,

    "uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message": 18635,

    "uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream": 19494,

    "uniffi_p2panda_ffi_checksum_method_node_id": 45319,

    "uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap": 19201,

    "uniffi_p2panda_ffi_checksum_method_node_network_id": 50875,

    "uniffi_p2panda_ffi_checksum_method_node_stream": 52148,

    "uniffi_p2panda_ffi_checksum_method_node_stream_from": 17067,

    "uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event": 30815,

    "uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error": 39094,

    "uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation": 23156,

    "uniffi_p2panda_ffi_checksum_method_event_body": 611,

    "uniffi_p2panda_ffi_checksum_method_event_header": 64065,

    "uniffi_p2panda_ffi_checksum_method_event_is_completed": 17564,

    "uniffi_p2panda_ffi_checksum_method_event_is_failed": 59684,

    "uniffi_p2panda_ffi_checksum_method_processedoperation_ack": 34154,

    "uniffi_p2panda_ffi_checksum_method_processedoperation_author": 17427,

    "uniffi_p2panda_ffi_checksum_method_processedoperation_id": 16528,

    "uniffi_p2panda_ffi_checksum_method_processedoperation_message": 4804,

    "uniffi_p2panda_ffi_checksum_method_processedoperation_processed": 21564,

    "uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp": 6001,

    "uniffi_p2panda_ffi_checksum_method_processedoperation_topic": 8589,

    "uniffi_p2panda_ffi_checksum_method_topicstream_ack": 2763,

    "uniffi_p2panda_ffi_checksum_method_topicstream_prune": 42833,

    "uniffi_p2panda_ffi_checksum_method_topicstream_publish": 12423,

    "uniffi_p2panda_ffi_checksum_method_topicstream_topic": 54824,

    "uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new": 50633,

    "uniffi_p2panda_ffi_checksum_constructor_hash_digest": 40866,

    "uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes": 43591,

    "uniffi_p2panda_ffi_checksum_constructor_hash_from_hex": 30875,

    "uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes": 51171,

    "uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash": 61064,

    "uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex": 51136,

    "uniffi_p2panda_ffi_checksum_constructor_networkid_random": 20320,

    "uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes": 9528,

    "uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex": 18057,

    "uniffi_p2panda_ffi_checksum_constructor_privatekey_generate": 31662,

    "uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes": 34513,

    "uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex": 51719,

    "uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str": 25654,

    "uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes": 42530,

    "uniffi_p2panda_ffi_checksum_constructor_signature_from_hex": 59832,

    "uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes": 16286,

    "uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash": 34777,

    "uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex": 27303,

    "uniffi_p2panda_ffi_checksum_constructor_topicid_random": 8969,

    "uniffi_p2panda_ffi_checksum_constructor_node_spawn": 35164,

  }),
});

let loadedBindings = null;
let loadedFfiTypes = null;
let loadedFfiFunctions = null;
// Koffi retains native state for repeated lib.func() declarations, so keep a
// single binding core alive across unload/load cycles and evict stale cores
// when switching to a different canonical library path.
let cachedBindingCore = null;
let cachedLibraryPath = null;
let runtimeHooks = Object.freeze({});
const moduleFilename = fileURLToPath(import.meta.url);
const moduleDirectory = dirname(moduleFilename);
const libraryNotLoadedMessage =
  "The native library is not loaded. Call load(libraryPath) first.";

function bundledPrebuildPlatform() {
  switch (process.platform) {
    case "aix":
    case "android":
    case "darwin":
    case "freebsd":
    case "linux":
    case "openbsd":
    case "win32":
      return process.platform;
    default:
      throw new Error(
        `Unsupported Node platform ${JSON.stringify(process.platform)} for UniFFI bundled prebuild resolution.`,
      );
  }
}

function bundledPrebuildArch() {
  switch (process.arch) {
    case "arm":
    case "arm64":
    case "ia32":
    case "loong64":
    case "ppc64":
    case "riscv64":
    case "s390x":
    case "x64":
      return process.arch;
    default:
      throw new Error(
        `Unsupported Node architecture ${JSON.stringify(process.arch)} for UniFFI bundled prebuild resolution.`,
      );
  }
}

function defaultBundledTarget() {
  const platform = bundledPrebuildPlatform();
  const arch = bundledPrebuildArch();
  if (platform !== "linux") {
    return `${platform}-${arch}`;
  }

  const glibcVersionRuntime =
    process.report?.getReport?.().header?.glibcVersionRuntime;
  const linuxLibc = glibcVersionRuntime == null ? "musl" : "gnu";
  return `${platform}-${arch}-${linuxLibc}`;
}

function bundledLibraryFileName(platform) {
  switch (platform) {
    case "win32":
      return `${ffiMetadata.cdylibName}.dll`;
    case "darwin":
      return `lib${ffiMetadata.cdylibName}.dylib`;
    case "aix":
    case "android":
    case "freebsd":
    case "linux":
    case "openbsd":
      return `lib${ffiMetadata.cdylibName}.so`;
    default:
      throw new Error(
        `Unsupported Node platform ${JSON.stringify(platform)} for UniFFI bundled prebuild resolution.`,
      );
  }
}

function defaultBundledLibrary() {
  const platform = bundledPrebuildPlatform();
  const target = defaultBundledTarget();
  const filename = bundledLibraryFileName(platform);
  return Object.freeze({
    target,
    packageRelativePath: `prebuilds/${target}/${filename}`,
    libraryPath: join(moduleDirectory, "prebuilds", target, filename),
  });
}

function defaultSiblingLibraryPath() {
  return join(moduleDirectory, ffiMetadata.stagedLibraryPackageRelativePath);
}

function resolveLibraryPath(libraryPath = undefined) {
  if (libraryPath != null) {
    return Object.freeze({
      libraryPath: isAbsolute(libraryPath)
        ? libraryPath
        : join(moduleDirectory, libraryPath),
      packageRelativePath: null,
      bundledPrebuild: null,
    });
  }

  if (ffiMetadata.bundledPrebuilds) {
    const bundledPrebuild = defaultBundledLibrary();
    return Object.freeze({
      libraryPath: bundledPrebuild.libraryPath,
      packageRelativePath: bundledPrebuild.packageRelativePath,
      bundledPrebuild,
    });
  }

  return Object.freeze({
    libraryPath: defaultSiblingLibraryPath(),
    packageRelativePath: ffiMetadata.stagedLibraryPackageRelativePath,
    bundledPrebuild: null,
  });
}

function canonicalizeExistingLibraryPath(libraryPath) {
  if (!existsSync(libraryPath)) {
    return libraryPath;
  }

  return typeof realpathSync.native === "function"
    ? realpathSync.native(libraryPath)
    : realpathSync(libraryPath);
}

function createBindingCore(libraryPath) {
  const library = koffi.load(libraryPath);

  const ffiTypes = Object.freeze({
    UniffiHandle,
    VoidPointer,
    RustBuffer,
    ForeignBytes,
    RustCallStatus,
  });
  const ffiCallbacks = {};

  ffiCallbacks.RustFutureContinuationCallback = defineCallbackPrototype("RustFutureContinuationCallback", "void", ["uint64_t", "int8_t"]);

  ffiCallbacks.ForeignFutureDroppedCallback = defineCallbackPrototype("ForeignFutureDroppedCallback", "void", ["uint64_t"]);

  ffiCallbacks.CallbackInterfaceFree = defineCallbackPrototype("CallbackInterfaceFree", "void", ["uint64_t"]);

  ffiCallbacks.CallbackInterfaceClone = defineCallbackPrototype("CallbackInterfaceClone", "uint64_t", ["uint64_t"]);

  ffiCallbacks.CallbackInterfaceEphemeralStreamCallbackMethod0 = defineCallbackPrototype("CallbackInterfaceEphemeralStreamCallbackMethod0", "void", ["uint64_t", ffiTypes.UniffiHandle, ffiTypes.VoidPointer, koffi.pointer(ffiTypes.RustCallStatus)]);

  ffiCallbacks.CallbackInterfaceTopicStreamCallbackMethod0 = defineCallbackPrototype("CallbackInterfaceTopicStreamCallbackMethod0", "void", ["uint64_t", ffiTypes.RustBuffer, ffiTypes.VoidPointer, koffi.pointer(ffiTypes.RustCallStatus)]);

  ffiCallbacks.CallbackInterfaceTopicStreamCallbackMethod1 = defineCallbackPrototype("CallbackInterfaceTopicStreamCallbackMethod1", "void", ["uint64_t", ffiTypes.RustBuffer, ffiTypes.VoidPointer, koffi.pointer(ffiTypes.RustCallStatus)]);

  ffiCallbacks.CallbackInterfaceTopicStreamCallbackMethod2 = defineCallbackPrototype("CallbackInterfaceTopicStreamCallbackMethod2", "void", ["uint64_t", ffiTypes.UniffiHandle, ffiTypes.RustBuffer, ffiTypes.VoidPointer, koffi.pointer(ffiTypes.RustCallStatus)]);

  const ffiStructs = {};


  ffiStructs.ForeignFutureDroppedCallbackStruct = defineStructType("ForeignFutureDroppedCallbackStruct", {

      "handle": "uint64_t",

      "free": koffi.pointer(ffiCallbacks.ForeignFutureDroppedCallback),

  });



  ffiStructs.ForeignFutureResultU8 = defineStructType("ForeignFutureResultU8", {

      "return_value": "uint8_t",

      "call_status": ffiTypes.RustCallStatus,

  });



  ffiStructs.ForeignFutureResultI8 = defineStructType("ForeignFutureResultI8", {

      "return_value": "int8_t",

      "call_status": ffiTypes.RustCallStatus,

  });



  ffiStructs.ForeignFutureResultU16 = defineStructType("ForeignFutureResultU16", {

      "return_value": "uint16_t",

      "call_status": ffiTypes.RustCallStatus,

  });



  ffiStructs.ForeignFutureResultI16 = defineStructType("ForeignFutureResultI16", {

      "return_value": "int16_t",

      "call_status": ffiTypes.RustCallStatus,

  });



  ffiStructs.ForeignFutureResultU32 = defineStructType("ForeignFutureResultU32", {

      "return_value": "uint32_t",

      "call_status": ffiTypes.RustCallStatus,

  });



  ffiStructs.ForeignFutureResultI32 = defineStructType("ForeignFutureResultI32", {

      "return_value": "int32_t",

      "call_status": ffiTypes.RustCallStatus,

  });



  ffiStructs.ForeignFutureResultU64 = defineStructType("ForeignFutureResultU64", {

      "return_value": "uint64_t",

      "call_status": ffiTypes.RustCallStatus,

  });



  ffiStructs.ForeignFutureResultI64 = defineStructType("ForeignFutureResultI64", {

      "return_value": "int64_t",

      "call_status": ffiTypes.RustCallStatus,

  });



  ffiStructs.ForeignFutureResultF32 = defineStructType("ForeignFutureResultF32", {

      "return_value": "float",

      "call_status": ffiTypes.RustCallStatus,

  });



  ffiStructs.ForeignFutureResultF64 = defineStructType("ForeignFutureResultF64", {

      "return_value": "double",

      "call_status": ffiTypes.RustCallStatus,

  });



  ffiStructs.ForeignFutureResultRustBuffer = defineStructType("ForeignFutureResultRustBuffer", {

      "return_value": ffiTypes.RustBuffer,

      "call_status": ffiTypes.RustCallStatus,

  });



  ffiStructs.ForeignFutureResultVoid = defineStructType("ForeignFutureResultVoid", {

      "call_status": ffiTypes.RustCallStatus,

  });







  ffiCallbacks.ForeignFutureCompleteU8 = defineCallbackPrototype("ForeignFutureCompleteU8", "void", ["uint64_t", ffiStructs.ForeignFutureResultU8]);

  ffiCallbacks.ForeignFutureCompleteI8 = defineCallbackPrototype("ForeignFutureCompleteI8", "void", ["uint64_t", ffiStructs.ForeignFutureResultI8]);

  ffiCallbacks.ForeignFutureCompleteU16 = defineCallbackPrototype("ForeignFutureCompleteU16", "void", ["uint64_t", ffiStructs.ForeignFutureResultU16]);

  ffiCallbacks.ForeignFutureCompleteI16 = defineCallbackPrototype("ForeignFutureCompleteI16", "void", ["uint64_t", ffiStructs.ForeignFutureResultI16]);

  ffiCallbacks.ForeignFutureCompleteU32 = defineCallbackPrototype("ForeignFutureCompleteU32", "void", ["uint64_t", ffiStructs.ForeignFutureResultU32]);

  ffiCallbacks.ForeignFutureCompleteI32 = defineCallbackPrototype("ForeignFutureCompleteI32", "void", ["uint64_t", ffiStructs.ForeignFutureResultI32]);

  ffiCallbacks.ForeignFutureCompleteU64 = defineCallbackPrototype("ForeignFutureCompleteU64", "void", ["uint64_t", ffiStructs.ForeignFutureResultU64]);

  ffiCallbacks.ForeignFutureCompleteI64 = defineCallbackPrototype("ForeignFutureCompleteI64", "void", ["uint64_t", ffiStructs.ForeignFutureResultI64]);

  ffiCallbacks.ForeignFutureCompleteF32 = defineCallbackPrototype("ForeignFutureCompleteF32", "void", ["uint64_t", ffiStructs.ForeignFutureResultF32]);

  ffiCallbacks.ForeignFutureCompleteF64 = defineCallbackPrototype("ForeignFutureCompleteF64", "void", ["uint64_t", ffiStructs.ForeignFutureResultF64]);

  ffiCallbacks.ForeignFutureCompleteRustBuffer = defineCallbackPrototype("ForeignFutureCompleteRustBuffer", "void", ["uint64_t", ffiStructs.ForeignFutureResultRustBuffer]);

  ffiCallbacks.ForeignFutureCompleteVoid = defineCallbackPrototype("ForeignFutureCompleteVoid", "void", ["uint64_t", ffiStructs.ForeignFutureResultVoid]);





























  ffiStructs.VTableCallbackInterfaceEphemeralStreamCallback = defineCallbackVtable("VTableCallbackInterfaceEphemeralStreamCallback", {

      "uniffi_free": koffi.pointer(ffiCallbacks.CallbackInterfaceFree),

      "uniffi_clone": koffi.pointer(ffiCallbacks.CallbackInterfaceClone),

      "on_message": koffi.pointer(ffiCallbacks.CallbackInterfaceEphemeralStreamCallbackMethod0),

  });



  ffiStructs.VTableCallbackInterfaceTopicStreamCallback = defineCallbackVtable("VTableCallbackInterfaceTopicStreamCallback", {

      "uniffi_free": koffi.pointer(ffiCallbacks.CallbackInterfaceFree),

      "uniffi_clone": koffi.pointer(ffiCallbacks.CallbackInterfaceClone),

      "on_event": koffi.pointer(ffiCallbacks.CallbackInterfaceTopicStreamCallbackMethod0),

      "on_error": koffi.pointer(ffiCallbacks.CallbackInterfaceTopicStreamCallbackMethod1),

      "on_operation": koffi.pointer(ffiCallbacks.CallbackInterfaceTopicStreamCallbackMethod2),

  });


  Object.freeze(ffiCallbacks);
  Object.freeze(ffiStructs);
  const ffiFunctions = Object.freeze({

    uniffi_p2panda_ffi_fn_clone_nodebuilder: library.func("uniffi_p2panda_ffi_fn_clone_nodebuilder", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_nodebuilder_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_nodebuilder", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_nodebuilder: library.func("uniffi_p2panda_ffi_fn_free_nodebuilder", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_nodebuilder_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_nodebuilder", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_nodebuilder_new: library.func("uniffi_p2panda_ffi_fn_constructor_nodebuilder_new", ffiTypes.UniffiHandle, [koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy", "void", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy", "void", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4", "void", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4", "void", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6", "void", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6", "void", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4", "void", [ffiTypes.UniffiHandle, "uint16_t", koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4", "void", [ffiTypes.UniffiHandle, "uint16_t", koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6", "void", [ffiTypes.UniffiHandle, "uint16_t", koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6", "void", [ffiTypes.UniffiHandle, "uint16_t", koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap", "void", [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap", "void", [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_nodebuilder_database_url: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_database_url", "void", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_nodebuilder_database_url_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_database_url", "void", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode", "void", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode", "void", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_nodebuilder_network_id: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_network_id", "void", [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_nodebuilder_network_id_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_network_id", "void", [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_nodebuilder_private_key: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_private_key", "void", [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_nodebuilder_private_key_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_private_key", "void", [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url", "void", [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url", "void", [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_nodebuilder_spawn: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_spawn", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle]),

    uniffi_p2panda_ffi_fn_method_nodebuilder_spawn_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_nodebuilder_spawn", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle]),


    uniffi_p2panda_ffi_fn_clone_cursor: library.func("uniffi_p2panda_ffi_fn_clone_cursor", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_cursor_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_cursor", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_cursor: library.func("uniffi_p2panda_ffi_fn_free_cursor", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_cursor_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_cursor", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_cursor_name: library.func("uniffi_p2panda_ffi_fn_method_cursor_name", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_cursor_name_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_cursor_name", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_hash: library.func("uniffi_p2panda_ffi_fn_clone_hash", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_hash_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_hash", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_hash: library.func("uniffi_p2panda_ffi_fn_free_hash", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_hash_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_hash", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_hash_digest: library.func("uniffi_p2panda_ffi_fn_constructor_hash_digest", ffiTypes.UniffiHandle, [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_hash_from_bytes: library.func("uniffi_p2panda_ffi_fn_constructor_hash_from_bytes", ffiTypes.UniffiHandle, [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_hash_from_hex: library.func("uniffi_p2panda_ffi_fn_constructor_hash_from_hex", ffiTypes.UniffiHandle, [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_hash_to_bytes: library.func("uniffi_p2panda_ffi_fn_method_hash_to_bytes", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_hash_to_bytes_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_hash_to_bytes", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_hash_to_hex: library.func("uniffi_p2panda_ffi_fn_method_hash_to_hex", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_hash_to_hex_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_hash_to_hex", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_header: library.func("uniffi_p2panda_ffi_fn_clone_header", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_header_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_header", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_header: library.func("uniffi_p2panda_ffi_fn_free_header", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_header_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_header", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_header_backlink: library.func("uniffi_p2panda_ffi_fn_method_header_backlink", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_header_backlink_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_header_backlink", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_header_hash: library.func("uniffi_p2panda_ffi_fn_method_header_hash", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_header_hash_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_header_hash", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_header_log_id: library.func("uniffi_p2panda_ffi_fn_method_header_log_id", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_header_log_id_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_header_log_id", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_header_payload_hash: library.func("uniffi_p2panda_ffi_fn_method_header_payload_hash", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_header_payload_hash_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_header_payload_hash", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_header_payload_size: library.func("uniffi_p2panda_ffi_fn_method_header_payload_size", "uint64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_header_payload_size_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_header_payload_size", "uint64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_header_prune_flag: library.func("uniffi_p2panda_ffi_fn_method_header_prune_flag", "int8_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_header_prune_flag_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_header_prune_flag", "int8_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_header_public_key: library.func("uniffi_p2panda_ffi_fn_method_header_public_key", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_header_public_key_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_header_public_key", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_header_seq_num: library.func("uniffi_p2panda_ffi_fn_method_header_seq_num", "uint64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_header_seq_num_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_header_seq_num", "uint64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_header_signature: library.func("uniffi_p2panda_ffi_fn_method_header_signature", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_header_signature_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_header_signature", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_header_timestamp: library.func("uniffi_p2panda_ffi_fn_method_header_timestamp", "uint64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_header_timestamp_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_header_timestamp", "uint64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_header_version: library.func("uniffi_p2panda_ffi_fn_method_header_version", "uint64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_header_version_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_header_version", "uint64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_networkid: library.func("uniffi_p2panda_ffi_fn_clone_networkid", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_networkid_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_networkid", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_networkid: library.func("uniffi_p2panda_ffi_fn_free_networkid", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_networkid_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_networkid", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_networkid_from_bytes: library.func("uniffi_p2panda_ffi_fn_constructor_networkid_from_bytes", ffiTypes.UniffiHandle, [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_networkid_from_hash: library.func("uniffi_p2panda_ffi_fn_constructor_networkid_from_hash", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_constructor_networkid_from_hash_generic_abi: library.func("uniffi_p2panda_ffi_fn_constructor_networkid_from_hash", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_networkid_from_hex: library.func("uniffi_p2panda_ffi_fn_constructor_networkid_from_hex", ffiTypes.UniffiHandle, [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_networkid_random: library.func("uniffi_p2panda_ffi_fn_constructor_networkid_random", ffiTypes.UniffiHandle, [koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_networkid_to_bytes: library.func("uniffi_p2panda_ffi_fn_method_networkid_to_bytes", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_networkid_to_bytes_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_networkid_to_bytes", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_networkid_to_hex: library.func("uniffi_p2panda_ffi_fn_method_networkid_to_hex", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_networkid_to_hex_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_networkid_to_hex", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_privatekey: library.func("uniffi_p2panda_ffi_fn_clone_privatekey", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_privatekey_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_privatekey", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_privatekey: library.func("uniffi_p2panda_ffi_fn_free_privatekey", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_privatekey_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_privatekey", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_privatekey_from_bytes: library.func("uniffi_p2panda_ffi_fn_constructor_privatekey_from_bytes", ffiTypes.UniffiHandle, [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_privatekey_from_hex: library.func("uniffi_p2panda_ffi_fn_constructor_privatekey_from_hex", ffiTypes.UniffiHandle, [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_privatekey_generate: library.func("uniffi_p2panda_ffi_fn_constructor_privatekey_generate", ffiTypes.UniffiHandle, [koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_privatekey_public_key: library.func("uniffi_p2panda_ffi_fn_method_privatekey_public_key", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_privatekey_public_key_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_privatekey_public_key", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_privatekey_sign: library.func("uniffi_p2panda_ffi_fn_method_privatekey_sign", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_privatekey_sign_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_privatekey_sign", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_privatekey_to_bytes: library.func("uniffi_p2panda_ffi_fn_method_privatekey_to_bytes", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_privatekey_to_bytes_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_privatekey_to_bytes", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_privatekey_to_hex: library.func("uniffi_p2panda_ffi_fn_method_privatekey_to_hex", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_privatekey_to_hex_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_privatekey_to_hex", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_publickey: library.func("uniffi_p2panda_ffi_fn_clone_publickey", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_publickey_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_publickey", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_publickey: library.func("uniffi_p2panda_ffi_fn_free_publickey", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_publickey_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_publickey", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_publickey_from_bytes: library.func("uniffi_p2panda_ffi_fn_constructor_publickey_from_bytes", ffiTypes.UniffiHandle, [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_publickey_from_hex: library.func("uniffi_p2panda_ffi_fn_constructor_publickey_from_hex", ffiTypes.UniffiHandle, [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_publickey_to_bytes: library.func("uniffi_p2panda_ffi_fn_method_publickey_to_bytes", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_publickey_to_bytes_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_publickey_to_bytes", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_publickey_to_hex: library.func("uniffi_p2panda_ffi_fn_method_publickey_to_hex", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_publickey_to_hex_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_publickey_to_hex", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_publickey_verify: library.func("uniffi_p2panda_ffi_fn_method_publickey_verify", "int8_t", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_publickey_verify_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_publickey_verify", "int8_t", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_relayurl: library.func("uniffi_p2panda_ffi_fn_clone_relayurl", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_relayurl_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_relayurl", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_relayurl: library.func("uniffi_p2panda_ffi_fn_free_relayurl", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_relayurl_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_relayurl", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_relayurl_from_str: library.func("uniffi_p2panda_ffi_fn_constructor_relayurl_from_str", ffiTypes.UniffiHandle, [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_relayurl_to_str: library.func("uniffi_p2panda_ffi_fn_method_relayurl_to_str", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_relayurl_to_str_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_relayurl_to_str", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_signature: library.func("uniffi_p2panda_ffi_fn_clone_signature", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_signature_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_signature", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_signature: library.func("uniffi_p2panda_ffi_fn_free_signature", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_signature_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_signature", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_signature_from_bytes: library.func("uniffi_p2panda_ffi_fn_constructor_signature_from_bytes", ffiTypes.UniffiHandle, [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_signature_from_hex: library.func("uniffi_p2panda_ffi_fn_constructor_signature_from_hex", ffiTypes.UniffiHandle, [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_signature_to_bytes: library.func("uniffi_p2panda_ffi_fn_method_signature_to_bytes", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_signature_to_bytes_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_signature_to_bytes", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_signature_to_hex: library.func("uniffi_p2panda_ffi_fn_method_signature_to_hex", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_signature_to_hex_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_signature_to_hex", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_topicid: library.func("uniffi_p2panda_ffi_fn_clone_topicid", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_topicid_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_topicid", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_topicid: library.func("uniffi_p2panda_ffi_fn_free_topicid", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_topicid_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_topicid", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_topicid_from_bytes: library.func("uniffi_p2panda_ffi_fn_constructor_topicid_from_bytes", ffiTypes.UniffiHandle, [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_topicid_from_hash: library.func("uniffi_p2panda_ffi_fn_constructor_topicid_from_hash", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_constructor_topicid_from_hash_generic_abi: library.func("uniffi_p2panda_ffi_fn_constructor_topicid_from_hash", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_topicid_from_hex: library.func("uniffi_p2panda_ffi_fn_constructor_topicid_from_hex", ffiTypes.UniffiHandle, [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_topicid_random: library.func("uniffi_p2panda_ffi_fn_constructor_topicid_random", ffiTypes.UniffiHandle, [koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_topicid_to_bytes: library.func("uniffi_p2panda_ffi_fn_method_topicid_to_bytes", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_topicid_to_bytes_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_topicid_to_bytes", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_topicid_to_hex: library.func("uniffi_p2panda_ffi_fn_method_topicid_to_hex", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_topicid_to_hex_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_topicid_to_hex", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_ephemeralmessage: library.func("uniffi_p2panda_ffi_fn_clone_ephemeralmessage", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_ephemeralmessage_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_ephemeralmessage", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_ephemeralmessage: library.func("uniffi_p2panda_ffi_fn_free_ephemeralmessage", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_ephemeralmessage_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_ephemeralmessage", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_ephemeralmessage_author: library.func("uniffi_p2panda_ffi_fn_method_ephemeralmessage_author", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_ephemeralmessage_author_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_ephemeralmessage_author", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_ephemeralmessage_body: library.func("uniffi_p2panda_ffi_fn_method_ephemeralmessage_body", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_ephemeralmessage_body_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_ephemeralmessage_body", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp: library.func("uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp", "uint64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp", "uint64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic: library.func("uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_ephemeralstream: library.func("uniffi_p2panda_ffi_fn_clone_ephemeralstream", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_ephemeralstream_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_ephemeralstream", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_ephemeralstream: library.func("uniffi_p2panda_ffi_fn_free_ephemeralstream", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_ephemeralstream_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_ephemeralstream", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_ephemeralstream_publish: library.func("uniffi_p2panda_ffi_fn_method_ephemeralstream_publish", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.RustBuffer]),

    uniffi_p2panda_ffi_fn_method_ephemeralstream_publish_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_ephemeralstream_publish", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.RustBuffer]),


    uniffi_p2panda_ffi_fn_method_ephemeralstream_topic: library.func("uniffi_p2panda_ffi_fn_method_ephemeralstream_topic", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_ephemeralstream_topic_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_ephemeralstream_topic", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback: library.func("uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback: library.func("uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_init_callback_vtable_ephemeralstreamcallback: library.func("uniffi_p2panda_ffi_fn_init_callback_vtable_ephemeralstreamcallback", "void", [koffi.pointer(ffiStructs.VTableCallbackInterfaceEphemeralStreamCallback)]),


    uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message: library.func("uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message", "void", [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message", "void", [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_node: library.func("uniffi_p2panda_ffi_fn_clone_node", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_node_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_node", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_node: library.func("uniffi_p2panda_ffi_fn_free_node", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_node_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_node", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_constructor_node_spawn: library.func("uniffi_p2panda_ffi_fn_constructor_node_spawn", ffiTypes.UniffiHandle, []),


    uniffi_p2panda_ffi_fn_method_node_ephemeral_stream: library.func("uniffi_p2panda_ffi_fn_method_node_ephemeral_stream", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, ffiTypes.UniffiHandle]),

    uniffi_p2panda_ffi_fn_method_node_ephemeral_stream_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_node_ephemeral_stream", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, ffiTypes.UniffiHandle]),


    uniffi_p2panda_ffi_fn_method_node_id: library.func("uniffi_p2panda_ffi_fn_method_node_id", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_node_id_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_node_id", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_node_insert_bootstrap: library.func("uniffi_p2panda_ffi_fn_method_node_insert_bootstrap", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, ffiTypes.UniffiHandle]),

    uniffi_p2panda_ffi_fn_method_node_insert_bootstrap_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_node_insert_bootstrap", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, ffiTypes.UniffiHandle]),


    uniffi_p2panda_ffi_fn_method_node_network_id: library.func("uniffi_p2panda_ffi_fn_method_node_network_id", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_node_network_id_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_node_network_id", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_node_stream: library.func("uniffi_p2panda_ffi_fn_method_node_stream", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, ffiTypes.UniffiHandle]),

    uniffi_p2panda_ffi_fn_method_node_stream_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_node_stream", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, ffiTypes.UniffiHandle]),


    uniffi_p2panda_ffi_fn_method_node_stream_from: library.func("uniffi_p2panda_ffi_fn_method_node_stream_from", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, ffiTypes.RustBuffer, ffiTypes.UniffiHandle]),

    uniffi_p2panda_ffi_fn_method_node_stream_from_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_node_stream_from", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, ffiTypes.RustBuffer, ffiTypes.UniffiHandle]),


    uniffi_p2panda_ffi_fn_clone_topicstreamcallback: library.func("uniffi_p2panda_ffi_fn_clone_topicstreamcallback", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_topicstreamcallback_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_topicstreamcallback", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_topicstreamcallback: library.func("uniffi_p2panda_ffi_fn_free_topicstreamcallback", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_topicstreamcallback_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_topicstreamcallback", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_init_callback_vtable_topicstreamcallback: library.func("uniffi_p2panda_ffi_fn_init_callback_vtable_topicstreamcallback", "void", [koffi.pointer(ffiStructs.VTableCallbackInterfaceTopicStreamCallback)]),


    uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event: library.func("uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event", "void", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event", "void", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error: library.func("uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error", "void", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error", "void", [ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation: library.func("uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation", "void", [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation", "void", [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle, ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_event: library.func("uniffi_p2panda_ffi_fn_clone_event", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_event_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_event", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_event: library.func("uniffi_p2panda_ffi_fn_free_event", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_event_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_event", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_event_body: library.func("uniffi_p2panda_ffi_fn_method_event_body", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_event_body_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_event_body", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_event_header: library.func("uniffi_p2panda_ffi_fn_method_event_header", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_event_header_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_event_header", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_event_is_completed: library.func("uniffi_p2panda_ffi_fn_method_event_is_completed", "int8_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_event_is_completed_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_event_is_completed", "int8_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_event_is_failed: library.func("uniffi_p2panda_ffi_fn_method_event_is_failed", "int8_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_event_is_failed_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_event_is_failed", "int8_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_processedoperation: library.func("uniffi_p2panda_ffi_fn_clone_processedoperation", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_processedoperation_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_processedoperation", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_processedoperation: library.func("uniffi_p2panda_ffi_fn_free_processedoperation", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_processedoperation_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_processedoperation", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_processedoperation_ack: library.func("uniffi_p2panda_ffi_fn_method_processedoperation_ack", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle]),

    uniffi_p2panda_ffi_fn_method_processedoperation_ack_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_processedoperation_ack", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle]),


    uniffi_p2panda_ffi_fn_method_processedoperation_author: library.func("uniffi_p2panda_ffi_fn_method_processedoperation_author", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_processedoperation_author_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_processedoperation_author", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_processedoperation_id: library.func("uniffi_p2panda_ffi_fn_method_processedoperation_id", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_processedoperation_id_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_processedoperation_id", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_processedoperation_message: library.func("uniffi_p2panda_ffi_fn_method_processedoperation_message", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_processedoperation_message_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_processedoperation_message", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_processedoperation_processed: library.func("uniffi_p2panda_ffi_fn_method_processedoperation_processed", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_processedoperation_processed_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_processedoperation_processed", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_processedoperation_timestamp: library.func("uniffi_p2panda_ffi_fn_method_processedoperation_timestamp", "uint64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_processedoperation_timestamp_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_processedoperation_timestamp", "uint64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_processedoperation_topic: library.func("uniffi_p2panda_ffi_fn_method_processedoperation_topic", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_processedoperation_topic_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_processedoperation_topic", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_clone_topicstream: library.func("uniffi_p2panda_ffi_fn_clone_topicstream", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_clone_topicstream_generic_abi: library.func("uniffi_p2panda_ffi_fn_clone_topicstream", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_free_topicstream: library.func("uniffi_p2panda_ffi_fn_free_topicstream", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_free_topicstream_generic_abi: library.func("uniffi_p2panda_ffi_fn_free_topicstream", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_fn_method_topicstream_ack: library.func("uniffi_p2panda_ffi_fn_method_topicstream_ack", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle]),

    uniffi_p2panda_ffi_fn_method_topicstream_ack_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_topicstream_ack", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.UniffiHandle]),


    uniffi_p2panda_ffi_fn_method_topicstream_prune: library.func("uniffi_p2panda_ffi_fn_method_topicstream_prune", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.RustBuffer]),

    uniffi_p2panda_ffi_fn_method_topicstream_prune_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_topicstream_prune", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.RustBuffer]),


    uniffi_p2panda_ffi_fn_method_topicstream_publish: library.func("uniffi_p2panda_ffi_fn_method_topicstream_publish", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.RustBuffer]),

    uniffi_p2panda_ffi_fn_method_topicstream_publish_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_topicstream_publish", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, ffiTypes.RustBuffer]),


    uniffi_p2panda_ffi_fn_method_topicstream_topic: library.func("uniffi_p2panda_ffi_fn_method_topicstream_topic", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    uniffi_p2panda_ffi_fn_method_topicstream_topic_generic_abi: library.func("uniffi_p2panda_ffi_fn_method_topicstream_topic", ffiTypes.UniffiHandle, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rustbuffer_alloc: library.func("ffi_p2panda_ffi_rustbuffer_alloc", ffiTypes.RustBuffer, ["uint64_t", koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rustbuffer_from_bytes: library.func("ffi_p2panda_ffi_rustbuffer_from_bytes", ffiTypes.RustBuffer, [ffiTypes.ForeignBytes, koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rustbuffer_free: library.func("ffi_p2panda_ffi_rustbuffer_free", "void", [ffiTypes.RustBuffer, koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rustbuffer_reserve: library.func("ffi_p2panda_ffi_rustbuffer_reserve", ffiTypes.RustBuffer, [ffiTypes.RustBuffer, "uint64_t", koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rust_future_poll_u8: library.func("ffi_p2panda_ffi_rust_future_poll_u8", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_poll_u8_generic_abi: library.func("ffi_p2panda_ffi_rust_future_poll_u8", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_cancel_u8: library.func("ffi_p2panda_ffi_rust_future_cancel_u8", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_cancel_u8_generic_abi: library.func("ffi_p2panda_ffi_rust_future_cancel_u8", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_free_u8: library.func("ffi_p2panda_ffi_rust_future_free_u8", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_free_u8_generic_abi: library.func("ffi_p2panda_ffi_rust_future_free_u8", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_complete_u8: library.func("ffi_p2panda_ffi_rust_future_complete_u8", "uint8_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    ffi_p2panda_ffi_rust_future_complete_u8_generic_abi: library.func("ffi_p2panda_ffi_rust_future_complete_u8", "uint8_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rust_future_poll_i8: library.func("ffi_p2panda_ffi_rust_future_poll_i8", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_poll_i8_generic_abi: library.func("ffi_p2panda_ffi_rust_future_poll_i8", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_cancel_i8: library.func("ffi_p2panda_ffi_rust_future_cancel_i8", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_cancel_i8_generic_abi: library.func("ffi_p2panda_ffi_rust_future_cancel_i8", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_free_i8: library.func("ffi_p2panda_ffi_rust_future_free_i8", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_free_i8_generic_abi: library.func("ffi_p2panda_ffi_rust_future_free_i8", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_complete_i8: library.func("ffi_p2panda_ffi_rust_future_complete_i8", "int8_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    ffi_p2panda_ffi_rust_future_complete_i8_generic_abi: library.func("ffi_p2panda_ffi_rust_future_complete_i8", "int8_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rust_future_poll_u16: library.func("ffi_p2panda_ffi_rust_future_poll_u16", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_poll_u16_generic_abi: library.func("ffi_p2panda_ffi_rust_future_poll_u16", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_cancel_u16: library.func("ffi_p2panda_ffi_rust_future_cancel_u16", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_cancel_u16_generic_abi: library.func("ffi_p2panda_ffi_rust_future_cancel_u16", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_free_u16: library.func("ffi_p2panda_ffi_rust_future_free_u16", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_free_u16_generic_abi: library.func("ffi_p2panda_ffi_rust_future_free_u16", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_complete_u16: library.func("ffi_p2panda_ffi_rust_future_complete_u16", "uint16_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    ffi_p2panda_ffi_rust_future_complete_u16_generic_abi: library.func("ffi_p2panda_ffi_rust_future_complete_u16", "uint16_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rust_future_poll_i16: library.func("ffi_p2panda_ffi_rust_future_poll_i16", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_poll_i16_generic_abi: library.func("ffi_p2panda_ffi_rust_future_poll_i16", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_cancel_i16: library.func("ffi_p2panda_ffi_rust_future_cancel_i16", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_cancel_i16_generic_abi: library.func("ffi_p2panda_ffi_rust_future_cancel_i16", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_free_i16: library.func("ffi_p2panda_ffi_rust_future_free_i16", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_free_i16_generic_abi: library.func("ffi_p2panda_ffi_rust_future_free_i16", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_complete_i16: library.func("ffi_p2panda_ffi_rust_future_complete_i16", "int16_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    ffi_p2panda_ffi_rust_future_complete_i16_generic_abi: library.func("ffi_p2panda_ffi_rust_future_complete_i16", "int16_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rust_future_poll_u32: library.func("ffi_p2panda_ffi_rust_future_poll_u32", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_poll_u32_generic_abi: library.func("ffi_p2panda_ffi_rust_future_poll_u32", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_cancel_u32: library.func("ffi_p2panda_ffi_rust_future_cancel_u32", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_cancel_u32_generic_abi: library.func("ffi_p2panda_ffi_rust_future_cancel_u32", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_free_u32: library.func("ffi_p2panda_ffi_rust_future_free_u32", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_free_u32_generic_abi: library.func("ffi_p2panda_ffi_rust_future_free_u32", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_complete_u32: library.func("ffi_p2panda_ffi_rust_future_complete_u32", "uint32_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    ffi_p2panda_ffi_rust_future_complete_u32_generic_abi: library.func("ffi_p2panda_ffi_rust_future_complete_u32", "uint32_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rust_future_poll_i32: library.func("ffi_p2panda_ffi_rust_future_poll_i32", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_poll_i32_generic_abi: library.func("ffi_p2panda_ffi_rust_future_poll_i32", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_cancel_i32: library.func("ffi_p2panda_ffi_rust_future_cancel_i32", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_cancel_i32_generic_abi: library.func("ffi_p2panda_ffi_rust_future_cancel_i32", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_free_i32: library.func("ffi_p2panda_ffi_rust_future_free_i32", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_free_i32_generic_abi: library.func("ffi_p2panda_ffi_rust_future_free_i32", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_complete_i32: library.func("ffi_p2panda_ffi_rust_future_complete_i32", "int32_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    ffi_p2panda_ffi_rust_future_complete_i32_generic_abi: library.func("ffi_p2panda_ffi_rust_future_complete_i32", "int32_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rust_future_poll_u64: library.func("ffi_p2panda_ffi_rust_future_poll_u64", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_poll_u64_generic_abi: library.func("ffi_p2panda_ffi_rust_future_poll_u64", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_cancel_u64: library.func("ffi_p2panda_ffi_rust_future_cancel_u64", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_cancel_u64_generic_abi: library.func("ffi_p2panda_ffi_rust_future_cancel_u64", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_free_u64: library.func("ffi_p2panda_ffi_rust_future_free_u64", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_free_u64_generic_abi: library.func("ffi_p2panda_ffi_rust_future_free_u64", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_complete_u64: library.func("ffi_p2panda_ffi_rust_future_complete_u64", "uint64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    ffi_p2panda_ffi_rust_future_complete_u64_generic_abi: library.func("ffi_p2panda_ffi_rust_future_complete_u64", "uint64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rust_future_poll_i64: library.func("ffi_p2panda_ffi_rust_future_poll_i64", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_poll_i64_generic_abi: library.func("ffi_p2panda_ffi_rust_future_poll_i64", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_cancel_i64: library.func("ffi_p2panda_ffi_rust_future_cancel_i64", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_cancel_i64_generic_abi: library.func("ffi_p2panda_ffi_rust_future_cancel_i64", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_free_i64: library.func("ffi_p2panda_ffi_rust_future_free_i64", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_free_i64_generic_abi: library.func("ffi_p2panda_ffi_rust_future_free_i64", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_complete_i64: library.func("ffi_p2panda_ffi_rust_future_complete_i64", "int64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    ffi_p2panda_ffi_rust_future_complete_i64_generic_abi: library.func("ffi_p2panda_ffi_rust_future_complete_i64", "int64_t", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rust_future_poll_f32: library.func("ffi_p2panda_ffi_rust_future_poll_f32", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_poll_f32_generic_abi: library.func("ffi_p2panda_ffi_rust_future_poll_f32", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_cancel_f32: library.func("ffi_p2panda_ffi_rust_future_cancel_f32", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_cancel_f32_generic_abi: library.func("ffi_p2panda_ffi_rust_future_cancel_f32", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_free_f32: library.func("ffi_p2panda_ffi_rust_future_free_f32", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_free_f32_generic_abi: library.func("ffi_p2panda_ffi_rust_future_free_f32", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_complete_f32: library.func("ffi_p2panda_ffi_rust_future_complete_f32", "float", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    ffi_p2panda_ffi_rust_future_complete_f32_generic_abi: library.func("ffi_p2panda_ffi_rust_future_complete_f32", "float", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rust_future_poll_f64: library.func("ffi_p2panda_ffi_rust_future_poll_f64", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_poll_f64_generic_abi: library.func("ffi_p2panda_ffi_rust_future_poll_f64", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_cancel_f64: library.func("ffi_p2panda_ffi_rust_future_cancel_f64", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_cancel_f64_generic_abi: library.func("ffi_p2panda_ffi_rust_future_cancel_f64", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_free_f64: library.func("ffi_p2panda_ffi_rust_future_free_f64", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_free_f64_generic_abi: library.func("ffi_p2panda_ffi_rust_future_free_f64", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_complete_f64: library.func("ffi_p2panda_ffi_rust_future_complete_f64", "double", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    ffi_p2panda_ffi_rust_future_complete_f64_generic_abi: library.func("ffi_p2panda_ffi_rust_future_complete_f64", "double", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rust_future_poll_rust_buffer: library.func("ffi_p2panda_ffi_rust_future_poll_rust_buffer", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_poll_rust_buffer_generic_abi: library.func("ffi_p2panda_ffi_rust_future_poll_rust_buffer", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_cancel_rust_buffer: library.func("ffi_p2panda_ffi_rust_future_cancel_rust_buffer", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_cancel_rust_buffer_generic_abi: library.func("ffi_p2panda_ffi_rust_future_cancel_rust_buffer", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_free_rust_buffer: library.func("ffi_p2panda_ffi_rust_future_free_rust_buffer", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_free_rust_buffer_generic_abi: library.func("ffi_p2panda_ffi_rust_future_free_rust_buffer", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_complete_rust_buffer: library.func("ffi_p2panda_ffi_rust_future_complete_rust_buffer", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    ffi_p2panda_ffi_rust_future_complete_rust_buffer_generic_abi: library.func("ffi_p2panda_ffi_rust_future_complete_rust_buffer", ffiTypes.RustBuffer, [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    ffi_p2panda_ffi_rust_future_poll_void: library.func("ffi_p2panda_ffi_rust_future_poll_void", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_poll_void_generic_abi: library.func("ffi_p2panda_ffi_rust_future_poll_void", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiCallbacks.RustFutureContinuationCallback), ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_cancel_void: library.func("ffi_p2panda_ffi_rust_future_cancel_void", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_cancel_void_generic_abi: library.func("ffi_p2panda_ffi_rust_future_cancel_void", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_free_void: library.func("ffi_p2panda_ffi_rust_future_free_void", "void", [ffiTypes.UniffiHandle]),

    ffi_p2panda_ffi_rust_future_free_void_generic_abi: library.func("ffi_p2panda_ffi_rust_future_free_void", "void", [ffiTypes.UniffiHandle]),


    ffi_p2panda_ffi_rust_future_complete_void: library.func("ffi_p2panda_ffi_rust_future_complete_void", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),

    ffi_p2panda_ffi_rust_future_complete_void_generic_abi: library.func("ffi_p2panda_ffi_rust_future_complete_void", "void", [ffiTypes.UniffiHandle, koffi.pointer(ffiTypes.RustCallStatus)]),


    uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy: library.func("uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4: library.func("uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6: library.func("uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4: library.func("uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6: library.func("uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap: library.func("uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url: library.func("uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode: library.func("uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id: library.func("uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key: library.func("uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url: library.func("uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn: library.func("uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_cursor_name: library.func("uniffi_p2panda_ffi_checksum_method_cursor_name", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_hash_to_bytes: library.func("uniffi_p2panda_ffi_checksum_method_hash_to_bytes", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_hash_to_hex: library.func("uniffi_p2panda_ffi_checksum_method_hash_to_hex", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_header_backlink: library.func("uniffi_p2panda_ffi_checksum_method_header_backlink", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_header_hash: library.func("uniffi_p2panda_ffi_checksum_method_header_hash", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_header_log_id: library.func("uniffi_p2panda_ffi_checksum_method_header_log_id", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_header_payload_hash: library.func("uniffi_p2panda_ffi_checksum_method_header_payload_hash", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_header_payload_size: library.func("uniffi_p2panda_ffi_checksum_method_header_payload_size", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_header_prune_flag: library.func("uniffi_p2panda_ffi_checksum_method_header_prune_flag", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_header_public_key: library.func("uniffi_p2panda_ffi_checksum_method_header_public_key", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_header_seq_num: library.func("uniffi_p2panda_ffi_checksum_method_header_seq_num", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_header_signature: library.func("uniffi_p2panda_ffi_checksum_method_header_signature", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_header_timestamp: library.func("uniffi_p2panda_ffi_checksum_method_header_timestamp", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_header_version: library.func("uniffi_p2panda_ffi_checksum_method_header_version", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_networkid_to_bytes: library.func("uniffi_p2panda_ffi_checksum_method_networkid_to_bytes", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_networkid_to_hex: library.func("uniffi_p2panda_ffi_checksum_method_networkid_to_hex", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_privatekey_public_key: library.func("uniffi_p2panda_ffi_checksum_method_privatekey_public_key", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_privatekey_sign: library.func("uniffi_p2panda_ffi_checksum_method_privatekey_sign", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes: library.func("uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_privatekey_to_hex: library.func("uniffi_p2panda_ffi_checksum_method_privatekey_to_hex", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_publickey_to_bytes: library.func("uniffi_p2panda_ffi_checksum_method_publickey_to_bytes", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_publickey_to_hex: library.func("uniffi_p2panda_ffi_checksum_method_publickey_to_hex", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_publickey_verify: library.func("uniffi_p2panda_ffi_checksum_method_publickey_verify", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_relayurl_to_str: library.func("uniffi_p2panda_ffi_checksum_method_relayurl_to_str", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_signature_to_bytes: library.func("uniffi_p2panda_ffi_checksum_method_signature_to_bytes", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_signature_to_hex: library.func("uniffi_p2panda_ffi_checksum_method_signature_to_hex", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_topicid_to_bytes: library.func("uniffi_p2panda_ffi_checksum_method_topicid_to_bytes", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_topicid_to_hex: library.func("uniffi_p2panda_ffi_checksum_method_topicid_to_hex", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author: library.func("uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body: library.func("uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp: library.func("uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic: library.func("uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish: library.func("uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic: library.func("uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message: library.func("uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream: library.func("uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_node_id: library.func("uniffi_p2panda_ffi_checksum_method_node_id", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap: library.func("uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_node_network_id: library.func("uniffi_p2panda_ffi_checksum_method_node_network_id", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_node_stream: library.func("uniffi_p2panda_ffi_checksum_method_node_stream", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_node_stream_from: library.func("uniffi_p2panda_ffi_checksum_method_node_stream_from", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event: library.func("uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error: library.func("uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation: library.func("uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_event_body: library.func("uniffi_p2panda_ffi_checksum_method_event_body", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_event_header: library.func("uniffi_p2panda_ffi_checksum_method_event_header", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_event_is_completed: library.func("uniffi_p2panda_ffi_checksum_method_event_is_completed", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_event_is_failed: library.func("uniffi_p2panda_ffi_checksum_method_event_is_failed", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_processedoperation_ack: library.func("uniffi_p2panda_ffi_checksum_method_processedoperation_ack", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_processedoperation_author: library.func("uniffi_p2panda_ffi_checksum_method_processedoperation_author", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_processedoperation_id: library.func("uniffi_p2panda_ffi_checksum_method_processedoperation_id", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_processedoperation_message: library.func("uniffi_p2panda_ffi_checksum_method_processedoperation_message", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_processedoperation_processed: library.func("uniffi_p2panda_ffi_checksum_method_processedoperation_processed", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp: library.func("uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_processedoperation_topic: library.func("uniffi_p2panda_ffi_checksum_method_processedoperation_topic", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_topicstream_ack: library.func("uniffi_p2panda_ffi_checksum_method_topicstream_ack", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_topicstream_prune: library.func("uniffi_p2panda_ffi_checksum_method_topicstream_prune", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_topicstream_publish: library.func("uniffi_p2panda_ffi_checksum_method_topicstream_publish", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_method_topicstream_topic: library.func("uniffi_p2panda_ffi_checksum_method_topicstream_topic", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new: library.func("uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_hash_digest: library.func("uniffi_p2panda_ffi_checksum_constructor_hash_digest", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes: library.func("uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_hash_from_hex: library.func("uniffi_p2panda_ffi_checksum_constructor_hash_from_hex", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes: library.func("uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash: library.func("uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex: library.func("uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_networkid_random: library.func("uniffi_p2panda_ffi_checksum_constructor_networkid_random", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes: library.func("uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex: library.func("uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_privatekey_generate: library.func("uniffi_p2panda_ffi_checksum_constructor_privatekey_generate", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes: library.func("uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex: library.func("uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str: library.func("uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes: library.func("uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_signature_from_hex: library.func("uniffi_p2panda_ffi_checksum_constructor_signature_from_hex", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes: library.func("uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash: library.func("uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex: library.func("uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_topicid_random: library.func("uniffi_p2panda_ffi_checksum_constructor_topicid_random", "uint16_t", []),


    uniffi_p2panda_ffi_checksum_constructor_node_spawn: library.func("uniffi_p2panda_ffi_checksum_constructor_node_spawn", "uint16_t", []),


    ffi_p2panda_ffi_uniffi_contract_version: library.func("ffi_p2panda_ffi_uniffi_contract_version", "uint32_t", []),


  });

  return Object.freeze({
    library,
    ffiTypes,
    ffiCallbacks,
    ffiStructs,
    ffiFunctions,
  });
}

function createBindings(libraryPath, bindingCore = undefined, resolution = undefined) {
  const core = bindingCore ?? createBindingCore(libraryPath);
  const packageRelativePath = resolution?.packageRelativePath ?? null;
  return Object.freeze({
    libraryPath,
    packageRelativePath,
    library: core.library,
    ffiTypes: core.ffiTypes,
    ffiCallbacks: core.ffiCallbacks,
    ffiStructs: core.ffiStructs,
    ffiFunctions: core.ffiFunctions,
  });
}

function cacheBindingCore(libraryPath, bindings) {
  cachedLibraryPath = libraryPath;
  cachedBindingCore = Object.freeze({
    library: bindings.library,
    ffiTypes: bindings.ffiTypes,
    ffiCallbacks: bindings.ffiCallbacks,
    ffiStructs: bindings.ffiStructs,
    ffiFunctions: bindings.ffiFunctions,
  });
  return cachedBindingCore;
}

function clearBindingCoreCache() {
  cachedBindingCore = null;
  cachedLibraryPath = null;
}

export function load(libraryPath = undefined) {
  const resolution = resolveLibraryPath(libraryPath);
  const resolvedLibraryPath = resolution.libraryPath;
  const packageRelativePath = resolution.packageRelativePath;
  const bundledPrebuild = resolution.bundledPrebuild;
  const canonicalLibraryPath = canonicalizeExistingLibraryPath(resolvedLibraryPath);

  if (loadedBindings !== null) {
    if (loadedBindings.libraryPath === canonicalLibraryPath) {
      return loadedBindings;
    }

    throw new Error(
      `The native library is already loaded from ${JSON.stringify(loadedBindings.libraryPath)}. Call unload() before loading a different library path.`,
    );
  }

  if (packageRelativePath !== null && !existsSync(resolvedLibraryPath)) {
    if (bundledPrebuild !== null) {
      throw new Error(
        `No bundled UniFFI library was found for target ${JSON.stringify(bundledPrebuild.target)}. The generated package expects ${JSON.stringify(bundledPrebuild.packageRelativePath)} at ${JSON.stringify(resolvedLibraryPath)}.`,
      );
    }

    throw new Error(
      `No packaged UniFFI library was found at ${JSON.stringify(packageRelativePath)}. The generated package expects ${JSON.stringify(resolvedLibraryPath)}.`,
    );
  }

  let bindingCore =
    cachedLibraryPath === canonicalLibraryPath
      ? cachedBindingCore
      : null;
  if (bindingCore == null && cachedBindingCore != null) {
    cachedBindingCore.library.unload();
    clearBindingCoreCache();
  }

  const bindings = createBindings(canonicalLibraryPath, bindingCore, resolution);
  try {
    runtimeHooks.onLoad?.(bindings);
    if (bindingCore == null) {
      validateContractVersion(bindings);
      validateChecksums(bindings);
      bindingCore = cacheBindingCore(canonicalLibraryPath, bindings);
    }
  } catch (error) {
    try {
      runtimeHooks.onUnload?.(bindings);
    } catch {
      // Preserve the original initialization failure.
    }
    if (bindingCore == null) {
      try {
        bindings.library.unload();
      } catch {
        // Preserve the original initialization failure.
      }
    }
    throw error;
  }

  loadedBindings = bindings;
  loadedFfiTypes = bindings.ffiTypes;
  loadedFfiFunctions = bindings.ffiFunctions;
  return loadedBindings;
}

export function unload() {
  if (loadedBindings === null) {
    return false;
  }

  let hookError = null;
  try {
    runtimeHooks.onUnload?.(loadedBindings);
  } catch (error) {
    hookError = error;
  }
  loadedBindings = null;
  loadedFfiTypes = null;
  loadedFfiFunctions = null;
  if (hookError != null) {
    throw hookError;
  }
  return true;
}

export function isLoaded() {
  return loadedBindings !== null;
}

export function configureRuntimeHooks(hooks = undefined) {
  runtimeHooks = Object.freeze(hooks ?? {});
}

function throwLibraryNotLoaded() {
  throw new LibraryNotLoadedError(libraryNotLoadedMessage);
}

export function getFfiBindings() {
  if (loadedBindings === null) {
    throwLibraryNotLoaded();
  }

  return loadedBindings;
}

export function getFfiTypes() {
  if (loadedFfiTypes === null) {
    throwLibraryNotLoaded();
  }

  return loadedFfiTypes;
}

function getLoadedFfiFunctions() {
  if (loadedFfiFunctions === null) {
    throwLibraryNotLoaded();
  }

  return loadedFfiFunctions;
}

export function getContractVersion(bindings = getFfiBindings()) {
  return bindings.ffiFunctions.ffi_p2panda_ffi_uniffi_contract_version();
}

export function validateContractVersion(bindings = getFfiBindings()) {
  const actual = getContractVersion(bindings);
  const expected = ffiIntegrity.expectedContractVersion;
  if (actual !== expected) {
    throw new ContractVersionMismatchError(expected, actual, {
      details: {
        libraryPath: bindings.libraryPath,
        packageRelativePath: bindings.packageRelativePath,
        symbolName: ffiIntegrity.contractVersionFunction,
      },
    });
  }
  return actual;
}

export function getChecksums(bindings = getFfiBindings()) {
  return Object.freeze({

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy(),

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4(),

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6(),

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4(),

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6(),

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap(),

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url(),

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode(),

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id(),

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key(),

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url(),

    "uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn(),

    "uniffi_p2panda_ffi_checksum_method_cursor_name": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_cursor_name(),

    "uniffi_p2panda_ffi_checksum_method_hash_to_bytes": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_hash_to_bytes(),

    "uniffi_p2panda_ffi_checksum_method_hash_to_hex": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_hash_to_hex(),

    "uniffi_p2panda_ffi_checksum_method_header_backlink": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_backlink(),

    "uniffi_p2panda_ffi_checksum_method_header_hash": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_hash(),

    "uniffi_p2panda_ffi_checksum_method_header_log_id": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_log_id(),

    "uniffi_p2panda_ffi_checksum_method_header_payload_hash": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_payload_hash(),

    "uniffi_p2panda_ffi_checksum_method_header_payload_size": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_payload_size(),

    "uniffi_p2panda_ffi_checksum_method_header_prune_flag": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_prune_flag(),

    "uniffi_p2panda_ffi_checksum_method_header_public_key": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_public_key(),

    "uniffi_p2panda_ffi_checksum_method_header_seq_num": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_seq_num(),

    "uniffi_p2panda_ffi_checksum_method_header_signature": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_signature(),

    "uniffi_p2panda_ffi_checksum_method_header_timestamp": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_timestamp(),

    "uniffi_p2panda_ffi_checksum_method_header_version": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_version(),

    "uniffi_p2panda_ffi_checksum_method_networkid_to_bytes": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_networkid_to_bytes(),

    "uniffi_p2panda_ffi_checksum_method_networkid_to_hex": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_networkid_to_hex(),

    "uniffi_p2panda_ffi_checksum_method_privatekey_public_key": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_privatekey_public_key(),

    "uniffi_p2panda_ffi_checksum_method_privatekey_sign": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_privatekey_sign(),

    "uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes(),

    "uniffi_p2panda_ffi_checksum_method_privatekey_to_hex": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_privatekey_to_hex(),

    "uniffi_p2panda_ffi_checksum_method_publickey_to_bytes": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_publickey_to_bytes(),

    "uniffi_p2panda_ffi_checksum_method_publickey_to_hex": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_publickey_to_hex(),

    "uniffi_p2panda_ffi_checksum_method_publickey_verify": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_publickey_verify(),

    "uniffi_p2panda_ffi_checksum_method_relayurl_to_str": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_relayurl_to_str(),

    "uniffi_p2panda_ffi_checksum_method_signature_to_bytes": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_signature_to_bytes(),

    "uniffi_p2panda_ffi_checksum_method_signature_to_hex": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_signature_to_hex(),

    "uniffi_p2panda_ffi_checksum_method_topicid_to_bytes": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicid_to_bytes(),

    "uniffi_p2panda_ffi_checksum_method_topicid_to_hex": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicid_to_hex(),

    "uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author(),

    "uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body(),

    "uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp(),

    "uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic(),

    "uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish(),

    "uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic(),

    "uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message(),

    "uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream(),

    "uniffi_p2panda_ffi_checksum_method_node_id": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_node_id(),

    "uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap(),

    "uniffi_p2panda_ffi_checksum_method_node_network_id": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_node_network_id(),

    "uniffi_p2panda_ffi_checksum_method_node_stream": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_node_stream(),

    "uniffi_p2panda_ffi_checksum_method_node_stream_from": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_node_stream_from(),

    "uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event(),

    "uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error(),

    "uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation(),

    "uniffi_p2panda_ffi_checksum_method_event_body": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_event_body(),

    "uniffi_p2panda_ffi_checksum_method_event_header": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_event_header(),

    "uniffi_p2panda_ffi_checksum_method_event_is_completed": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_event_is_completed(),

    "uniffi_p2panda_ffi_checksum_method_event_is_failed": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_event_is_failed(),

    "uniffi_p2panda_ffi_checksum_method_processedoperation_ack": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_processedoperation_ack(),

    "uniffi_p2panda_ffi_checksum_method_processedoperation_author": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_processedoperation_author(),

    "uniffi_p2panda_ffi_checksum_method_processedoperation_id": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_processedoperation_id(),

    "uniffi_p2panda_ffi_checksum_method_processedoperation_message": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_processedoperation_message(),

    "uniffi_p2panda_ffi_checksum_method_processedoperation_processed": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_processedoperation_processed(),

    "uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp(),

    "uniffi_p2panda_ffi_checksum_method_processedoperation_topic": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_processedoperation_topic(),

    "uniffi_p2panda_ffi_checksum_method_topicstream_ack": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicstream_ack(),

    "uniffi_p2panda_ffi_checksum_method_topicstream_prune": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicstream_prune(),

    "uniffi_p2panda_ffi_checksum_method_topicstream_publish": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicstream_publish(),

    "uniffi_p2panda_ffi_checksum_method_topicstream_topic": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicstream_topic(),

    "uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new(),

    "uniffi_p2panda_ffi_checksum_constructor_hash_digest": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_hash_digest(),

    "uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes(),

    "uniffi_p2panda_ffi_checksum_constructor_hash_from_hex": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_hash_from_hex(),

    "uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes(),

    "uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash(),

    "uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex(),

    "uniffi_p2panda_ffi_checksum_constructor_networkid_random": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_networkid_random(),

    "uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes(),

    "uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex(),

    "uniffi_p2panda_ffi_checksum_constructor_privatekey_generate": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_privatekey_generate(),

    "uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes(),

    "uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex(),

    "uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str(),

    "uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes(),

    "uniffi_p2panda_ffi_checksum_constructor_signature_from_hex": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_signature_from_hex(),

    "uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes(),

    "uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash(),

    "uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex(),

    "uniffi_p2panda_ffi_checksum_constructor_topicid_random": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_topicid_random(),

    "uniffi_p2panda_ffi_checksum_constructor_node_spawn": bindings.ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_node_spawn(),

  });
}

export function validateChecksums(bindings = getFfiBindings()) {
  const actualChecksums = getChecksums(bindings);

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_cursor_name"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_cursor_name"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_cursor_name", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_hash_to_bytes"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_hash_to_bytes"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_hash_to_bytes", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_hash_to_hex"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_hash_to_hex"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_hash_to_hex", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_header_backlink"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_header_backlink"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_header_backlink", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_header_hash"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_header_hash"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_header_hash", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_header_log_id"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_header_log_id"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_header_log_id", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_header_payload_hash"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_header_payload_hash"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_header_payload_hash", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_header_payload_size"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_header_payload_size"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_header_payload_size", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_header_prune_flag"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_header_prune_flag"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_header_prune_flag", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_header_public_key"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_header_public_key"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_header_public_key", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_header_seq_num"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_header_seq_num"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_header_seq_num", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_header_signature"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_header_signature"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_header_signature", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_header_timestamp"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_header_timestamp"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_header_timestamp", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_header_version"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_header_version"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_header_version", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_networkid_to_bytes"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_networkid_to_bytes"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_networkid_to_bytes", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_networkid_to_hex"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_networkid_to_hex"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_networkid_to_hex", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_privatekey_public_key"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_privatekey_public_key"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_privatekey_public_key", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_privatekey_sign"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_privatekey_sign"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_privatekey_sign", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_privatekey_to_hex"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_privatekey_to_hex"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_privatekey_to_hex", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_publickey_to_bytes"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_publickey_to_bytes"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_publickey_to_bytes", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_publickey_to_hex"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_publickey_to_hex"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_publickey_to_hex", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_publickey_verify"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_publickey_verify"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_publickey_verify", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_relayurl_to_str"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_relayurl_to_str"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_relayurl_to_str", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_signature_to_bytes"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_signature_to_bytes"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_signature_to_bytes", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_signature_to_hex"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_signature_to_hex"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_signature_to_hex", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_topicid_to_bytes"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_topicid_to_bytes"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_topicid_to_bytes", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_topicid_to_hex"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_topicid_to_hex"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_topicid_to_hex", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_node_id"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_node_id"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_node_id", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_node_network_id"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_node_network_id"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_node_network_id", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_node_stream"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_node_stream"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_node_stream", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_node_stream_from"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_node_stream_from"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_node_stream_from", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_event_body"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_event_body"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_event_body", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_event_header"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_event_header"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_event_header", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_event_is_completed"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_event_is_completed"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_event_is_completed", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_event_is_failed"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_event_is_failed"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_event_is_failed", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_processedoperation_ack"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_processedoperation_ack"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_processedoperation_ack", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_processedoperation_author"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_processedoperation_author"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_processedoperation_author", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_processedoperation_id"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_processedoperation_id"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_processedoperation_id", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_processedoperation_message"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_processedoperation_message"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_processedoperation_message", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_processedoperation_processed"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_processedoperation_processed"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_processedoperation_processed", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_processedoperation_topic"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_processedoperation_topic"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_processedoperation_topic", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_topicstream_ack"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_topicstream_ack"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_topicstream_ack", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_topicstream_prune"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_topicstream_prune"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_topicstream_prune", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_topicstream_publish"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_topicstream_publish"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_topicstream_publish", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_method_topicstream_topic"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_method_topicstream_topic"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_method_topicstream_topic", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_hash_digest"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_hash_digest"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_hash_digest", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_hash_from_hex"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_hash_from_hex"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_hash_from_hex", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_networkid_random"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_networkid_random"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_networkid_random", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_privatekey_generate"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_privatekey_generate"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_privatekey_generate", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_signature_from_hex"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_signature_from_hex"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_signature_from_hex", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_topicid_random"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_topicid_random"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_topicid_random", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  {
    const expected = ffiIntegrity.checksums["uniffi_p2panda_ffi_checksum_constructor_node_spawn"];
    const actual = actualChecksums["uniffi_p2panda_ffi_checksum_constructor_node_spawn"];
    if (actual !== expected) {
      throw new ChecksumMismatchError("uniffi_p2panda_ffi_checksum_constructor_node_spawn", expected, actual, {
        details: {
          libraryPath: bindings.libraryPath,
          packageRelativePath: bindings.packageRelativePath,
        },
      });
    }
  }

  return actualChecksums;
}

export const ffiFunctions = Object.freeze({

  uniffi_p2panda_ffi_fn_clone_nodebuilder(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_nodebuilder(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_nodebuilder_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_nodebuilder_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_nodebuilder(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_nodebuilder(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_nodebuilder_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_nodebuilder_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_constructor_nodebuilder_new(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_nodebuilder_new(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_database_url(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_database_url(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_database_url_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_database_url_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_network_id(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_network_id(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_network_id_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_network_id_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_private_key(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_private_key(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_private_key_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_private_key_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_spawn(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_spawn(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_nodebuilder_spawn_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_nodebuilder_spawn_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_cursor(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_cursor(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_cursor_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_cursor_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_cursor(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_cursor(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_cursor_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_cursor_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_cursor_name(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_cursor_name(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_cursor_name_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_cursor_name_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_clone_hash(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_hash(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_hash_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_hash_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_hash(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_hash(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_hash_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_hash_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_constructor_hash_digest(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_hash_digest(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_constructor_hash_from_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_hash_from_bytes(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_constructor_hash_from_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_hash_from_hex(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_hash_to_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_hash_to_bytes(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_hash_to_bytes_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_hash_to_bytes_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_hash_to_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_hash_to_hex(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_hash_to_hex_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_hash_to_hex_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_clone_header(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_header(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_header_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_header_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_header(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_header(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_header_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_header_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_header_backlink(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_backlink(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_header_backlink_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_backlink_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_header_hash(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_hash(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_header_hash_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_hash_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_header_log_id(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_log_id(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_header_log_id_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_log_id_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_header_payload_hash(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_payload_hash(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_header_payload_hash_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_payload_hash_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_header_payload_size(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_payload_size(...args);

    return normalizeUInt64(result);

  },


  uniffi_p2panda_ffi_fn_method_header_payload_size_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_payload_size_generic_abi(...args);

    return normalizeUInt64(result);

  },


  uniffi_p2panda_ffi_fn_method_header_prune_flag(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_prune_flag(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_header_prune_flag_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_prune_flag_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_header_public_key(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_public_key(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_header_public_key_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_public_key_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_header_seq_num(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_seq_num(...args);

    return normalizeUInt64(result);

  },


  uniffi_p2panda_ffi_fn_method_header_seq_num_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_seq_num_generic_abi(...args);

    return normalizeUInt64(result);

  },


  uniffi_p2panda_ffi_fn_method_header_signature(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_signature(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_header_signature_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_signature_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_header_timestamp(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_timestamp(...args);

    return normalizeUInt64(result);

  },


  uniffi_p2panda_ffi_fn_method_header_timestamp_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_timestamp_generic_abi(...args);

    return normalizeUInt64(result);

  },


  uniffi_p2panda_ffi_fn_method_header_version(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_version(...args);

    return normalizeUInt64(result);

  },


  uniffi_p2panda_ffi_fn_method_header_version_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_header_version_generic_abi(...args);

    return normalizeUInt64(result);

  },


  uniffi_p2panda_ffi_fn_clone_networkid(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_networkid(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_networkid_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_networkid_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_networkid(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_networkid(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_networkid_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_networkid_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_constructor_networkid_from_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_networkid_from_bytes(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_constructor_networkid_from_hash(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_networkid_from_hash(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_constructor_networkid_from_hash_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_networkid_from_hash_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_constructor_networkid_from_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_networkid_from_hex(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_constructor_networkid_random(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_networkid_random(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_networkid_to_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_networkid_to_bytes(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_networkid_to_bytes_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_networkid_to_bytes_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_networkid_to_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_networkid_to_hex(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_networkid_to_hex_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_networkid_to_hex_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_clone_privatekey(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_privatekey(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_privatekey_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_privatekey_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_privatekey(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_privatekey(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_privatekey_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_privatekey_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_constructor_privatekey_from_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_privatekey_from_bytes(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_constructor_privatekey_from_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_privatekey_from_hex(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_constructor_privatekey_generate(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_privatekey_generate(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_privatekey_public_key(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_privatekey_public_key(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_privatekey_public_key_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_privatekey_public_key_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_privatekey_sign(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_privatekey_sign(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_privatekey_sign_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_privatekey_sign_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_privatekey_to_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_privatekey_to_bytes(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_privatekey_to_bytes_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_privatekey_to_bytes_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_privatekey_to_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_privatekey_to_hex(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_privatekey_to_hex_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_privatekey_to_hex_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_clone_publickey(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_publickey(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_publickey_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_publickey_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_publickey(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_publickey(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_publickey_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_publickey_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_constructor_publickey_from_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_publickey_from_bytes(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_constructor_publickey_from_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_publickey_from_hex(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_publickey_to_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_publickey_to_bytes(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_publickey_to_bytes_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_publickey_to_bytes_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_publickey_to_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_publickey_to_hex(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_publickey_to_hex_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_publickey_to_hex_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_publickey_verify(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_publickey_verify(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_publickey_verify_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_publickey_verify_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_clone_relayurl(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_relayurl(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_relayurl_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_relayurl_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_relayurl(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_relayurl(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_relayurl_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_relayurl_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_constructor_relayurl_from_str(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_relayurl_from_str(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_relayurl_to_str(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_relayurl_to_str(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_relayurl_to_str_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_relayurl_to_str_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_clone_signature(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_signature(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_signature_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_signature_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_signature(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_signature(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_signature_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_signature_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_constructor_signature_from_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_signature_from_bytes(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_constructor_signature_from_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_signature_from_hex(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_signature_to_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_signature_to_bytes(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_signature_to_bytes_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_signature_to_bytes_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_signature_to_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_signature_to_hex(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_signature_to_hex_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_signature_to_hex_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_clone_topicid(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_topicid(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_topicid_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_topicid_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_topicid(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_topicid(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_topicid_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_topicid_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_constructor_topicid_from_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_topicid_from_bytes(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_constructor_topicid_from_hash(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_topicid_from_hash(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_constructor_topicid_from_hash_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_topicid_from_hash_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_constructor_topicid_from_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_topicid_from_hex(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_constructor_topicid_random(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_topicid_random(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_topicid_to_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicid_to_bytes(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_topicid_to_bytes_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicid_to_bytes_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_topicid_to_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicid_to_hex(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_topicid_to_hex_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicid_to_hex_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_clone_ephemeralmessage(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_ephemeralmessage(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_ephemeralmessage_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_ephemeralmessage_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_ephemeralmessage(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_ephemeralmessage(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_ephemeralmessage_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_ephemeralmessage_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_ephemeralmessage_author(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_ephemeralmessage_author(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_ephemeralmessage_author_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_ephemeralmessage_author_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_ephemeralmessage_body(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_ephemeralmessage_body(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_ephemeralmessage_body_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_ephemeralmessage_body_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp(...args);

    return normalizeUInt64(result);

  },


  uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp_generic_abi(...args);

    return normalizeUInt64(result);

  },


  uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_ephemeralstream(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_ephemeralstream(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_ephemeralstream_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_ephemeralstream_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_ephemeralstream(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_ephemeralstream(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_ephemeralstream_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_ephemeralstream_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_ephemeralstream_publish(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_ephemeralstream_publish(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_ephemeralstream_publish_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_ephemeralstream_publish_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_ephemeralstream_topic(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_ephemeralstream_topic(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_ephemeralstream_topic_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_ephemeralstream_topic_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_init_callback_vtable_ephemeralstreamcallback(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_init_callback_vtable_ephemeralstreamcallback(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_clone_node(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_node(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_node_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_node_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_node(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_node(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_node_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_node_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_constructor_node_spawn(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_constructor_node_spawn(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_node_ephemeral_stream(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_node_ephemeral_stream(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_node_ephemeral_stream_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_node_ephemeral_stream_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_node_id(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_node_id(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_node_id_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_node_id_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_node_insert_bootstrap(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_node_insert_bootstrap(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_node_insert_bootstrap_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_node_insert_bootstrap_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_node_network_id(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_node_network_id(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_node_network_id_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_node_network_id_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_node_stream(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_node_stream(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_node_stream_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_node_stream_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_node_stream_from(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_node_stream_from(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_node_stream_from_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_node_stream_from_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_topicstreamcallback(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_topicstreamcallback(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_topicstreamcallback_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_topicstreamcallback_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_topicstreamcallback(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_topicstreamcallback(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_topicstreamcallback_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_topicstreamcallback_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_init_callback_vtable_topicstreamcallback(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_init_callback_vtable_topicstreamcallback(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_clone_event(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_event(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_event_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_event_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_event(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_event(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_event_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_event_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_event_body(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_event_body(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_event_body_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_event_body_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_event_header(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_event_header(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_event_header_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_event_header_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_event_is_completed(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_event_is_completed(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_event_is_completed_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_event_is_completed_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_event_is_failed(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_event_is_failed(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_event_is_failed_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_event_is_failed_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_clone_processedoperation(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_processedoperation(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_processedoperation_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_processedoperation_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_processedoperation(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_processedoperation(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_processedoperation_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_processedoperation_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_processedoperation_ack(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_processedoperation_ack(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_processedoperation_ack_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_processedoperation_ack_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_processedoperation_author(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_processedoperation_author(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_processedoperation_author_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_processedoperation_author_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_processedoperation_id(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_processedoperation_id(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_processedoperation_id_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_processedoperation_id_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_processedoperation_message(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_processedoperation_message(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_processedoperation_message_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_processedoperation_message_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  uniffi_p2panda_ffi_fn_method_processedoperation_processed(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_processedoperation_processed(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_processedoperation_processed_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_processedoperation_processed_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_processedoperation_timestamp(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_processedoperation_timestamp(...args);

    return normalizeUInt64(result);

  },


  uniffi_p2panda_ffi_fn_method_processedoperation_timestamp_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_processedoperation_timestamp_generic_abi(...args);

    return normalizeUInt64(result);

  },


  uniffi_p2panda_ffi_fn_method_processedoperation_topic(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_processedoperation_topic(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_processedoperation_topic_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_processedoperation_topic_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_topicstream(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_topicstream(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_clone_topicstream_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_clone_topicstream_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_free_topicstream(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_topicstream(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_free_topicstream_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_free_topicstream_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_fn_method_topicstream_ack(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicstream_ack(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_topicstream_ack_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicstream_ack_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_topicstream_prune(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicstream_prune(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_topicstream_prune_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicstream_prune_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_topicstream_publish(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicstream_publish(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_topicstream_publish_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicstream_publish_generic_abi(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_topicstream_topic(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicstream_topic(...args);

    return normalizeHandle(result);

  },


  uniffi_p2panda_ffi_fn_method_topicstream_topic_generic_abi(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_fn_method_topicstream_topic_generic_abi(...args);

    return normalizeHandle(result);

  },


  ffi_p2panda_ffi_rustbuffer_alloc(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rustbuffer_alloc(...args);

    return normalizeRustBuffer(result);

  },


  ffi_p2panda_ffi_rustbuffer_from_bytes(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rustbuffer_from_bytes(...args);

    return normalizeRustBuffer(result);

  },


  ffi_p2panda_ffi_rustbuffer_free(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rustbuffer_free(...args);

    return result;

  },


  ffi_p2panda_ffi_rustbuffer_reserve(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rustbuffer_reserve(...args);

    return normalizeRustBuffer(result);

  },


  ffi_p2panda_ffi_rust_future_poll_u8(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_u8(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_u8_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_u8_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_u8(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_u8(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_u8_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_u8_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_u8(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_u8(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_u8_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_u8_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_u8(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_u8(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_u8_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_u8_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_i8(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_i8(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_i8_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_i8_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_i8(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_i8(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_i8_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_i8_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_i8(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_i8(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_i8_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_i8_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_i8(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_i8(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_i8_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_i8_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_u16(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_u16(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_u16_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_u16_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_u16(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_u16(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_u16_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_u16_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_u16(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_u16(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_u16_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_u16_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_u16(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_u16(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_u16_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_u16_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_i16(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_i16(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_i16_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_i16_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_i16(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_i16(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_i16_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_i16_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_i16(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_i16(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_i16_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_i16_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_i16(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_i16(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_i16_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_i16_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_u32(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_u32(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_u32_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_u32_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_u32(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_u32(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_u32_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_u32_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_u32(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_u32(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_u32_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_u32_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_u32(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_u32(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_u32_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_u32_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_i32(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_i32(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_i32_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_i32_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_i32(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_i32(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_i32_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_i32_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_i32(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_i32(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_i32_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_i32_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_i32(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_i32(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_i32_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_i32_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_u64(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_u64(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_u64_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_u64_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_u64(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_u64(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_u64_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_u64_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_u64(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_u64(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_u64_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_u64_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_u64(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_u64(...args);

    return normalizeUInt64(result);

  },


  ffi_p2panda_ffi_rust_future_complete_u64_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_u64_generic_abi(...args);

    return normalizeUInt64(result);

  },


  ffi_p2panda_ffi_rust_future_poll_i64(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_i64(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_i64_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_i64_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_i64(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_i64(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_i64_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_i64_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_i64(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_i64(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_i64_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_i64_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_i64(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_i64(...args);

    return normalizeInt64(result);

  },


  ffi_p2panda_ffi_rust_future_complete_i64_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_i64_generic_abi(...args);

    return normalizeInt64(result);

  },


  ffi_p2panda_ffi_rust_future_poll_f32(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_f32(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_f32_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_f32_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_f32(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_f32(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_f32_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_f32_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_f32(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_f32(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_f32_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_f32_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_f32(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_f32(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_f32_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_f32_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_f64(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_f64(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_f64_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_f64_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_f64(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_f64(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_f64_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_f64_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_f64(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_f64(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_f64_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_f64_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_f64(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_f64(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_f64_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_f64_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_rust_buffer(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_rust_buffer(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_rust_buffer_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_rust_buffer_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_rust_buffer(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_rust_buffer(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_rust_buffer_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_rust_buffer_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_rust_buffer(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_rust_buffer(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_rust_buffer_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_rust_buffer_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_rust_buffer(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_rust_buffer(...args);

    return normalizeRustBuffer(result);

  },


  ffi_p2panda_ffi_rust_future_complete_rust_buffer_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_rust_buffer_generic_abi(...args);

    return normalizeRustBuffer(result);

  },


  ffi_p2panda_ffi_rust_future_poll_void(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_void(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_poll_void_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_poll_void_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_void(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_void(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_cancel_void_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_cancel_void_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_void(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_void(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_free_void_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_free_void_generic_abi(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_void(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_void(...args);

    return result;

  },


  ffi_p2panda_ffi_rust_future_complete_void_generic_abi(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_rust_future_complete_void_generic_abi(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_cursor_name(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_cursor_name(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_hash_to_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_hash_to_bytes(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_hash_to_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_hash_to_hex(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_header_backlink(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_header_backlink(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_header_hash(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_header_hash(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_header_log_id(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_header_log_id(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_header_payload_hash(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_header_payload_hash(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_header_payload_size(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_header_payload_size(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_header_prune_flag(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_header_prune_flag(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_header_public_key(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_header_public_key(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_header_seq_num(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_header_seq_num(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_header_signature(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_header_signature(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_header_timestamp(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_header_timestamp(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_header_version(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_header_version(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_networkid_to_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_networkid_to_bytes(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_networkid_to_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_networkid_to_hex(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_privatekey_public_key(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_privatekey_public_key(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_privatekey_sign(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_privatekey_sign(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_privatekey_to_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_privatekey_to_hex(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_publickey_to_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_publickey_to_bytes(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_publickey_to_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_publickey_to_hex(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_publickey_verify(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_publickey_verify(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_relayurl_to_str(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_relayurl_to_str(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_signature_to_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_signature_to_bytes(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_signature_to_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_signature_to_hex(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_topicid_to_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_topicid_to_bytes(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_topicid_to_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_topicid_to_hex(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_node_id(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_node_id(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_node_network_id(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_node_network_id(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_node_stream(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_node_stream(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_node_stream_from(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_node_stream_from(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_event_body(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_event_body(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_event_header(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_event_header(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_event_is_completed(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_event_is_completed(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_event_is_failed(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_event_is_failed(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_processedoperation_ack(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_processedoperation_ack(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_processedoperation_author(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_processedoperation_author(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_processedoperation_id(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_processedoperation_id(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_processedoperation_message(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_processedoperation_message(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_processedoperation_processed(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_processedoperation_processed(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_processedoperation_topic(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_processedoperation_topic(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_topicstream_ack(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_topicstream_ack(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_topicstream_prune(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_topicstream_prune(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_topicstream_publish(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_topicstream_publish(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_method_topicstream_topic(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_method_topicstream_topic(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_hash_digest(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_hash_digest(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_hash_from_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_hash_from_hex(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_networkid_random(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_networkid_random(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_privatekey_generate(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_privatekey_generate(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_signature_from_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_signature_from_hex(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_topicid_random(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_topicid_random(...args);

    return result;

  },


  uniffi_p2panda_ffi_checksum_constructor_node_spawn(...args) {
    const result = getLoadedFfiFunctions().uniffi_p2panda_ffi_checksum_constructor_node_spawn(...args);

    return result;

  },


  ffi_p2panda_ffi_uniffi_contract_version(...args) {
    const result = getLoadedFfiFunctions().ffi_p2panda_ffi_uniffi_contract_version(...args);

    return result;

  },


});


export function uniffi_p2panda_ffi_fn_clone_nodebuilder(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_nodebuilder(...args);
}


export function uniffi_p2panda_ffi_fn_clone_nodebuilder_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_nodebuilder_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_nodebuilder(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_nodebuilder(...args);
}


export function uniffi_p2panda_ffi_fn_free_nodebuilder_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_nodebuilder_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_nodebuilder_new(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_nodebuilder_new(...args);
}



export function uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy(...args);
}


export function uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4(...args);
}


export function uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6(...args);
}


export function uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4(...args);
}


export function uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6(...args);
}


export function uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap(...args);
}


export function uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_nodebuilder_database_url(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_database_url(...args);
}


export function uniffi_p2panda_ffi_fn_method_nodebuilder_database_url_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_database_url_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode(...args);
}


export function uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_nodebuilder_network_id(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_network_id(...args);
}


export function uniffi_p2panda_ffi_fn_method_nodebuilder_network_id_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_network_id_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_nodebuilder_private_key(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_private_key(...args);
}


export function uniffi_p2panda_ffi_fn_method_nodebuilder_private_key_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_private_key_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url(...args);
}


export function uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_nodebuilder_spawn(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_spawn(...args);
}


export function uniffi_p2panda_ffi_fn_method_nodebuilder_spawn_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_nodebuilder_spawn_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_cursor(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_cursor(...args);
}


export function uniffi_p2panda_ffi_fn_clone_cursor_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_cursor_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_cursor(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_cursor(...args);
}


export function uniffi_p2panda_ffi_fn_free_cursor_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_cursor_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_cursor_name(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_cursor_name(...args);
}


export function uniffi_p2panda_ffi_fn_method_cursor_name_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_cursor_name_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_hash(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_hash(...args);
}


export function uniffi_p2panda_ffi_fn_clone_hash_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_hash_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_hash(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_hash(...args);
}


export function uniffi_p2panda_ffi_fn_free_hash_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_hash_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_hash_digest(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_hash_digest(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_hash_from_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_hash_from_bytes(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_hash_from_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_hash_from_hex(...args);
}



export function uniffi_p2panda_ffi_fn_method_hash_to_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_hash_to_bytes(...args);
}


export function uniffi_p2panda_ffi_fn_method_hash_to_bytes_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_hash_to_bytes_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_hash_to_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_hash_to_hex(...args);
}


export function uniffi_p2panda_ffi_fn_method_hash_to_hex_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_hash_to_hex_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_header(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_header(...args);
}


export function uniffi_p2panda_ffi_fn_clone_header_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_header_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_header(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_header(...args);
}


export function uniffi_p2panda_ffi_fn_free_header_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_header_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_header_backlink(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_backlink(...args);
}


export function uniffi_p2panda_ffi_fn_method_header_backlink_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_backlink_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_header_hash(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_hash(...args);
}


export function uniffi_p2panda_ffi_fn_method_header_hash_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_hash_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_header_log_id(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_log_id(...args);
}


export function uniffi_p2panda_ffi_fn_method_header_log_id_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_log_id_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_header_payload_hash(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_payload_hash(...args);
}


export function uniffi_p2panda_ffi_fn_method_header_payload_hash_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_payload_hash_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_header_payload_size(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_payload_size(...args);
}


export function uniffi_p2panda_ffi_fn_method_header_payload_size_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_payload_size_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_header_prune_flag(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_prune_flag(...args);
}


export function uniffi_p2panda_ffi_fn_method_header_prune_flag_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_prune_flag_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_header_public_key(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_public_key(...args);
}


export function uniffi_p2panda_ffi_fn_method_header_public_key_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_public_key_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_header_seq_num(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_seq_num(...args);
}


export function uniffi_p2panda_ffi_fn_method_header_seq_num_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_seq_num_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_header_signature(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_signature(...args);
}


export function uniffi_p2panda_ffi_fn_method_header_signature_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_signature_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_header_timestamp(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_timestamp(...args);
}


export function uniffi_p2panda_ffi_fn_method_header_timestamp_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_timestamp_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_header_version(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_version(...args);
}


export function uniffi_p2panda_ffi_fn_method_header_version_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_header_version_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_networkid(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_networkid(...args);
}


export function uniffi_p2panda_ffi_fn_clone_networkid_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_networkid_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_networkid(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_networkid(...args);
}


export function uniffi_p2panda_ffi_fn_free_networkid_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_networkid_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_networkid_from_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_networkid_from_bytes(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_networkid_from_hash(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_networkid_from_hash(...args);
}


export function uniffi_p2panda_ffi_fn_constructor_networkid_from_hash_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_networkid_from_hash_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_networkid_from_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_networkid_from_hex(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_networkid_random(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_networkid_random(...args);
}



export function uniffi_p2panda_ffi_fn_method_networkid_to_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_networkid_to_bytes(...args);
}


export function uniffi_p2panda_ffi_fn_method_networkid_to_bytes_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_networkid_to_bytes_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_networkid_to_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_networkid_to_hex(...args);
}


export function uniffi_p2panda_ffi_fn_method_networkid_to_hex_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_networkid_to_hex_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_privatekey(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_privatekey(...args);
}


export function uniffi_p2panda_ffi_fn_clone_privatekey_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_privatekey_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_privatekey(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_privatekey(...args);
}


export function uniffi_p2panda_ffi_fn_free_privatekey_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_privatekey_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_privatekey_from_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_privatekey_from_bytes(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_privatekey_from_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_privatekey_from_hex(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_privatekey_generate(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_privatekey_generate(...args);
}



export function uniffi_p2panda_ffi_fn_method_privatekey_public_key(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_public_key(...args);
}


export function uniffi_p2panda_ffi_fn_method_privatekey_public_key_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_public_key_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_privatekey_sign(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_sign(...args);
}


export function uniffi_p2panda_ffi_fn_method_privatekey_sign_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_sign_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_privatekey_to_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_to_bytes(...args);
}


export function uniffi_p2panda_ffi_fn_method_privatekey_to_bytes_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_to_bytes_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_privatekey_to_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_to_hex(...args);
}


export function uniffi_p2panda_ffi_fn_method_privatekey_to_hex_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_privatekey_to_hex_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_publickey(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_publickey(...args);
}


export function uniffi_p2panda_ffi_fn_clone_publickey_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_publickey_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_publickey(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_publickey(...args);
}


export function uniffi_p2panda_ffi_fn_free_publickey_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_publickey_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_publickey_from_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_publickey_from_bytes(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_publickey_from_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_publickey_from_hex(...args);
}



export function uniffi_p2panda_ffi_fn_method_publickey_to_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_publickey_to_bytes(...args);
}


export function uniffi_p2panda_ffi_fn_method_publickey_to_bytes_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_publickey_to_bytes_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_publickey_to_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_publickey_to_hex(...args);
}


export function uniffi_p2panda_ffi_fn_method_publickey_to_hex_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_publickey_to_hex_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_publickey_verify(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_publickey_verify(...args);
}


export function uniffi_p2panda_ffi_fn_method_publickey_verify_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_publickey_verify_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_relayurl(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_relayurl(...args);
}


export function uniffi_p2panda_ffi_fn_clone_relayurl_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_relayurl_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_relayurl(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_relayurl(...args);
}


export function uniffi_p2panda_ffi_fn_free_relayurl_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_relayurl_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_relayurl_from_str(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_relayurl_from_str(...args);
}



export function uniffi_p2panda_ffi_fn_method_relayurl_to_str(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_relayurl_to_str(...args);
}


export function uniffi_p2panda_ffi_fn_method_relayurl_to_str_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_relayurl_to_str_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_signature(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_signature(...args);
}


export function uniffi_p2panda_ffi_fn_clone_signature_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_signature_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_signature(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_signature(...args);
}


export function uniffi_p2panda_ffi_fn_free_signature_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_signature_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_signature_from_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_signature_from_bytes(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_signature_from_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_signature_from_hex(...args);
}



export function uniffi_p2panda_ffi_fn_method_signature_to_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_signature_to_bytes(...args);
}


export function uniffi_p2panda_ffi_fn_method_signature_to_bytes_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_signature_to_bytes_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_signature_to_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_signature_to_hex(...args);
}


export function uniffi_p2panda_ffi_fn_method_signature_to_hex_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_signature_to_hex_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_topicid(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_topicid(...args);
}


export function uniffi_p2panda_ffi_fn_clone_topicid_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_topicid_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_topicid(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_topicid(...args);
}


export function uniffi_p2panda_ffi_fn_free_topicid_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_topicid_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_topicid_from_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_topicid_from_bytes(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_topicid_from_hash(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_topicid_from_hash(...args);
}


export function uniffi_p2panda_ffi_fn_constructor_topicid_from_hash_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_topicid_from_hash_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_topicid_from_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_topicid_from_hex(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_topicid_random(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_topicid_random(...args);
}



export function uniffi_p2panda_ffi_fn_method_topicid_to_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicid_to_bytes(...args);
}


export function uniffi_p2panda_ffi_fn_method_topicid_to_bytes_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicid_to_bytes_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_topicid_to_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicid_to_hex(...args);
}


export function uniffi_p2panda_ffi_fn_method_topicid_to_hex_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicid_to_hex_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_ephemeralmessage(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_ephemeralmessage(...args);
}


export function uniffi_p2panda_ffi_fn_clone_ephemeralmessage_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_ephemeralmessage_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_ephemeralmessage(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_ephemeralmessage(...args);
}


export function uniffi_p2panda_ffi_fn_free_ephemeralmessage_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_ephemeralmessage_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_ephemeralmessage_author(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_author(...args);
}


export function uniffi_p2panda_ffi_fn_method_ephemeralmessage_author_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_author_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_ephemeralmessage_body(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_body(...args);
}


export function uniffi_p2panda_ffi_fn_method_ephemeralmessage_body_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_body_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp(...args);
}


export function uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic(...args);
}


export function uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_ephemeralstream(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_ephemeralstream(...args);
}


export function uniffi_p2panda_ffi_fn_clone_ephemeralstream_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_ephemeralstream_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_ephemeralstream(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_ephemeralstream(...args);
}


export function uniffi_p2panda_ffi_fn_free_ephemeralstream_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_ephemeralstream_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_ephemeralstream_publish(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralstream_publish(...args);
}


export function uniffi_p2panda_ffi_fn_method_ephemeralstream_publish_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralstream_publish_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_ephemeralstream_topic(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralstream_topic(...args);
}


export function uniffi_p2panda_ffi_fn_method_ephemeralstream_topic_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralstream_topic_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback(...args);
}


export function uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback(...args);
}


export function uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_init_callback_vtable_ephemeralstreamcallback(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_init_callback_vtable_ephemeralstreamcallback(...args);
}



export function uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message(...args);
}


export function uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_node(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_node(...args);
}


export function uniffi_p2panda_ffi_fn_clone_node_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_node_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_node(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_node(...args);
}


export function uniffi_p2panda_ffi_fn_free_node_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_node_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_constructor_node_spawn(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_constructor_node_spawn(...args);
}



export function uniffi_p2panda_ffi_fn_method_node_ephemeral_stream(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_node_ephemeral_stream(...args);
}


export function uniffi_p2panda_ffi_fn_method_node_ephemeral_stream_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_node_ephemeral_stream_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_node_id(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_node_id(...args);
}


export function uniffi_p2panda_ffi_fn_method_node_id_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_node_id_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_node_insert_bootstrap(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_node_insert_bootstrap(...args);
}


export function uniffi_p2panda_ffi_fn_method_node_insert_bootstrap_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_node_insert_bootstrap_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_node_network_id(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_node_network_id(...args);
}


export function uniffi_p2panda_ffi_fn_method_node_network_id_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_node_network_id_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_node_stream(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_node_stream(...args);
}


export function uniffi_p2panda_ffi_fn_method_node_stream_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_node_stream_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_node_stream_from(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_node_stream_from(...args);
}


export function uniffi_p2panda_ffi_fn_method_node_stream_from_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_node_stream_from_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_topicstreamcallback(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_topicstreamcallback(...args);
}


export function uniffi_p2panda_ffi_fn_clone_topicstreamcallback_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_topicstreamcallback_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_topicstreamcallback(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_topicstreamcallback(...args);
}


export function uniffi_p2panda_ffi_fn_free_topicstreamcallback_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_topicstreamcallback_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_init_callback_vtable_topicstreamcallback(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_init_callback_vtable_topicstreamcallback(...args);
}



export function uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event(...args);
}


export function uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error(...args);
}


export function uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation(...args);
}


export function uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_event(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_event(...args);
}


export function uniffi_p2panda_ffi_fn_clone_event_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_event_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_event(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_event(...args);
}


export function uniffi_p2panda_ffi_fn_free_event_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_event_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_event_body(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_event_body(...args);
}


export function uniffi_p2panda_ffi_fn_method_event_body_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_event_body_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_event_header(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_event_header(...args);
}


export function uniffi_p2panda_ffi_fn_method_event_header_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_event_header_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_event_is_completed(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_event_is_completed(...args);
}


export function uniffi_p2panda_ffi_fn_method_event_is_completed_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_event_is_completed_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_event_is_failed(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_event_is_failed(...args);
}


export function uniffi_p2panda_ffi_fn_method_event_is_failed_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_event_is_failed_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_processedoperation(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_processedoperation(...args);
}


export function uniffi_p2panda_ffi_fn_clone_processedoperation_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_processedoperation_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_processedoperation(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_processedoperation(...args);
}


export function uniffi_p2panda_ffi_fn_free_processedoperation_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_processedoperation_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_processedoperation_ack(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_ack(...args);
}


export function uniffi_p2panda_ffi_fn_method_processedoperation_ack_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_ack_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_processedoperation_author(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_author(...args);
}


export function uniffi_p2panda_ffi_fn_method_processedoperation_author_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_author_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_processedoperation_id(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_id(...args);
}


export function uniffi_p2panda_ffi_fn_method_processedoperation_id_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_id_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_processedoperation_message(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_message(...args);
}


export function uniffi_p2panda_ffi_fn_method_processedoperation_message_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_message_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_processedoperation_processed(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_processed(...args);
}


export function uniffi_p2panda_ffi_fn_method_processedoperation_processed_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_processed_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_processedoperation_timestamp(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_timestamp(...args);
}


export function uniffi_p2panda_ffi_fn_method_processedoperation_timestamp_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_timestamp_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_processedoperation_topic(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_topic(...args);
}


export function uniffi_p2panda_ffi_fn_method_processedoperation_topic_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_processedoperation_topic_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_clone_topicstream(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_topicstream(...args);
}


export function uniffi_p2panda_ffi_fn_clone_topicstream_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_clone_topicstream_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_free_topicstream(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_topicstream(...args);
}


export function uniffi_p2panda_ffi_fn_free_topicstream_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_free_topicstream_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_topicstream_ack(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_ack(...args);
}


export function uniffi_p2panda_ffi_fn_method_topicstream_ack_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_ack_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_topicstream_prune(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_prune(...args);
}


export function uniffi_p2panda_ffi_fn_method_topicstream_prune_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_prune_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_topicstream_publish(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_publish(...args);
}


export function uniffi_p2panda_ffi_fn_method_topicstream_publish_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_publish_generic_abi(...args);
}



export function uniffi_p2panda_ffi_fn_method_topicstream_topic(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_topic(...args);
}


export function uniffi_p2panda_ffi_fn_method_topicstream_topic_generic_abi(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_fn_method_topicstream_topic_generic_abi(...args);
}



export function ffi_p2panda_ffi_rustbuffer_alloc(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rustbuffer_alloc(...args);
}



export function ffi_p2panda_ffi_rustbuffer_from_bytes(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rustbuffer_from_bytes(...args);
}



export function ffi_p2panda_ffi_rustbuffer_free(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rustbuffer_free(...args);
}



export function ffi_p2panda_ffi_rustbuffer_reserve(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rustbuffer_reserve(...args);
}



export function ffi_p2panda_ffi_rust_future_poll_u8(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u8(...args);
}


export function ffi_p2panda_ffi_rust_future_poll_u8_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u8_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_cancel_u8(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u8(...args);
}


export function ffi_p2panda_ffi_rust_future_cancel_u8_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u8_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_free_u8(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_u8(...args);
}


export function ffi_p2panda_ffi_rust_future_free_u8_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_u8_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_complete_u8(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_u8(...args);
}


export function ffi_p2panda_ffi_rust_future_complete_u8_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_u8_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_poll_i8(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_i8(...args);
}


export function ffi_p2panda_ffi_rust_future_poll_i8_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_i8_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_cancel_i8(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_i8(...args);
}


export function ffi_p2panda_ffi_rust_future_cancel_i8_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_i8_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_free_i8(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_i8(...args);
}


export function ffi_p2panda_ffi_rust_future_free_i8_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_i8_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_complete_i8(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_i8(...args);
}


export function ffi_p2panda_ffi_rust_future_complete_i8_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_i8_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_poll_u16(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u16(...args);
}


export function ffi_p2panda_ffi_rust_future_poll_u16_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u16_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_cancel_u16(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u16(...args);
}


export function ffi_p2panda_ffi_rust_future_cancel_u16_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u16_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_free_u16(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_u16(...args);
}


export function ffi_p2panda_ffi_rust_future_free_u16_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_u16_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_complete_u16(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_u16(...args);
}


export function ffi_p2panda_ffi_rust_future_complete_u16_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_u16_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_poll_i16(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_i16(...args);
}


export function ffi_p2panda_ffi_rust_future_poll_i16_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_i16_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_cancel_i16(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_i16(...args);
}


export function ffi_p2panda_ffi_rust_future_cancel_i16_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_i16_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_free_i16(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_i16(...args);
}


export function ffi_p2panda_ffi_rust_future_free_i16_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_i16_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_complete_i16(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_i16(...args);
}


export function ffi_p2panda_ffi_rust_future_complete_i16_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_i16_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_poll_u32(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u32(...args);
}


export function ffi_p2panda_ffi_rust_future_poll_u32_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u32_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_cancel_u32(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u32(...args);
}


export function ffi_p2panda_ffi_rust_future_cancel_u32_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u32_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_free_u32(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_u32(...args);
}


export function ffi_p2panda_ffi_rust_future_free_u32_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_u32_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_complete_u32(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_u32(...args);
}


export function ffi_p2panda_ffi_rust_future_complete_u32_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_u32_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_poll_i32(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_i32(...args);
}


export function ffi_p2panda_ffi_rust_future_poll_i32_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_i32_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_cancel_i32(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_i32(...args);
}


export function ffi_p2panda_ffi_rust_future_cancel_i32_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_i32_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_free_i32(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_i32(...args);
}


export function ffi_p2panda_ffi_rust_future_free_i32_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_i32_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_complete_i32(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_i32(...args);
}


export function ffi_p2panda_ffi_rust_future_complete_i32_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_i32_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_poll_u64(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u64(...args);
}


export function ffi_p2panda_ffi_rust_future_poll_u64_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_u64_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_cancel_u64(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u64(...args);
}


export function ffi_p2panda_ffi_rust_future_cancel_u64_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_u64_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_free_u64(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_u64(...args);
}


export function ffi_p2panda_ffi_rust_future_free_u64_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_u64_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_complete_u64(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_u64(...args);
}


export function ffi_p2panda_ffi_rust_future_complete_u64_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_u64_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_poll_i64(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_i64(...args);
}


export function ffi_p2panda_ffi_rust_future_poll_i64_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_i64_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_cancel_i64(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_i64(...args);
}


export function ffi_p2panda_ffi_rust_future_cancel_i64_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_i64_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_free_i64(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_i64(...args);
}


export function ffi_p2panda_ffi_rust_future_free_i64_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_i64_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_complete_i64(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_i64(...args);
}


export function ffi_p2panda_ffi_rust_future_complete_i64_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_i64_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_poll_f32(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_f32(...args);
}


export function ffi_p2panda_ffi_rust_future_poll_f32_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_f32_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_cancel_f32(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_f32(...args);
}


export function ffi_p2panda_ffi_rust_future_cancel_f32_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_f32_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_free_f32(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_f32(...args);
}


export function ffi_p2panda_ffi_rust_future_free_f32_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_f32_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_complete_f32(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_f32(...args);
}


export function ffi_p2panda_ffi_rust_future_complete_f32_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_f32_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_poll_f64(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_f64(...args);
}


export function ffi_p2panda_ffi_rust_future_poll_f64_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_f64_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_cancel_f64(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_f64(...args);
}


export function ffi_p2panda_ffi_rust_future_cancel_f64_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_f64_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_free_f64(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_f64(...args);
}


export function ffi_p2panda_ffi_rust_future_free_f64_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_f64_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_complete_f64(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_f64(...args);
}


export function ffi_p2panda_ffi_rust_future_complete_f64_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_f64_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_poll_rust_buffer(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_rust_buffer(...args);
}


export function ffi_p2panda_ffi_rust_future_poll_rust_buffer_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_rust_buffer_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_cancel_rust_buffer(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_rust_buffer(...args);
}


export function ffi_p2panda_ffi_rust_future_cancel_rust_buffer_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_rust_buffer_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_free_rust_buffer(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_rust_buffer(...args);
}


export function ffi_p2panda_ffi_rust_future_free_rust_buffer_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_rust_buffer_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_complete_rust_buffer(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_rust_buffer(...args);
}


export function ffi_p2panda_ffi_rust_future_complete_rust_buffer_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_rust_buffer_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_poll_void(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_void(...args);
}


export function ffi_p2panda_ffi_rust_future_poll_void_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_poll_void_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_cancel_void(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_void(...args);
}


export function ffi_p2panda_ffi_rust_future_cancel_void_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_cancel_void_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_free_void(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_void(...args);
}


export function ffi_p2panda_ffi_rust_future_free_void_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_free_void_generic_abi(...args);
}



export function ffi_p2panda_ffi_rust_future_complete_void(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_void(...args);
}


export function ffi_p2panda_ffi_rust_future_complete_void_generic_abi(...args) {
  return ffiFunctions.ffi_p2panda_ffi_rust_future_complete_void_generic_abi(...args);
}



export function uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy(...args);
}



export function uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4(...args);
}



export function uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6(...args);
}



export function uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4(...args);
}



export function uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6(...args);
}



export function uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap(...args);
}



export function uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url(...args);
}



export function uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode(...args);
}



export function uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id(...args);
}



export function uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key(...args);
}



export function uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url(...args);
}



export function uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn(...args);
}



export function uniffi_p2panda_ffi_checksum_method_cursor_name(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_cursor_name(...args);
}



export function uniffi_p2panda_ffi_checksum_method_hash_to_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_hash_to_bytes(...args);
}



export function uniffi_p2panda_ffi_checksum_method_hash_to_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_hash_to_hex(...args);
}



export function uniffi_p2panda_ffi_checksum_method_header_backlink(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_backlink(...args);
}



export function uniffi_p2panda_ffi_checksum_method_header_hash(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_hash(...args);
}



export function uniffi_p2panda_ffi_checksum_method_header_log_id(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_log_id(...args);
}



export function uniffi_p2panda_ffi_checksum_method_header_payload_hash(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_payload_hash(...args);
}



export function uniffi_p2panda_ffi_checksum_method_header_payload_size(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_payload_size(...args);
}



export function uniffi_p2panda_ffi_checksum_method_header_prune_flag(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_prune_flag(...args);
}



export function uniffi_p2panda_ffi_checksum_method_header_public_key(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_public_key(...args);
}



export function uniffi_p2panda_ffi_checksum_method_header_seq_num(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_seq_num(...args);
}



export function uniffi_p2panda_ffi_checksum_method_header_signature(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_signature(...args);
}



export function uniffi_p2panda_ffi_checksum_method_header_timestamp(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_timestamp(...args);
}



export function uniffi_p2panda_ffi_checksum_method_header_version(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_header_version(...args);
}



export function uniffi_p2panda_ffi_checksum_method_networkid_to_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_networkid_to_bytes(...args);
}



export function uniffi_p2panda_ffi_checksum_method_networkid_to_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_networkid_to_hex(...args);
}



export function uniffi_p2panda_ffi_checksum_method_privatekey_public_key(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_privatekey_public_key(...args);
}



export function uniffi_p2panda_ffi_checksum_method_privatekey_sign(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_privatekey_sign(...args);
}



export function uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes(...args);
}



export function uniffi_p2panda_ffi_checksum_method_privatekey_to_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_privatekey_to_hex(...args);
}



export function uniffi_p2panda_ffi_checksum_method_publickey_to_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_publickey_to_bytes(...args);
}



export function uniffi_p2panda_ffi_checksum_method_publickey_to_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_publickey_to_hex(...args);
}



export function uniffi_p2panda_ffi_checksum_method_publickey_verify(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_publickey_verify(...args);
}



export function uniffi_p2panda_ffi_checksum_method_relayurl_to_str(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_relayurl_to_str(...args);
}



export function uniffi_p2panda_ffi_checksum_method_signature_to_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_signature_to_bytes(...args);
}



export function uniffi_p2panda_ffi_checksum_method_signature_to_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_signature_to_hex(...args);
}



export function uniffi_p2panda_ffi_checksum_method_topicid_to_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicid_to_bytes(...args);
}



export function uniffi_p2panda_ffi_checksum_method_topicid_to_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicid_to_hex(...args);
}



export function uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author(...args);
}



export function uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body(...args);
}



export function uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp(...args);
}



export function uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic(...args);
}



export function uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish(...args);
}



export function uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic(...args);
}



export function uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message(...args);
}



export function uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream(...args);
}



export function uniffi_p2panda_ffi_checksum_method_node_id(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_node_id(...args);
}



export function uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap(...args);
}



export function uniffi_p2panda_ffi_checksum_method_node_network_id(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_node_network_id(...args);
}



export function uniffi_p2panda_ffi_checksum_method_node_stream(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_node_stream(...args);
}



export function uniffi_p2panda_ffi_checksum_method_node_stream_from(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_node_stream_from(...args);
}



export function uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event(...args);
}



export function uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error(...args);
}



export function uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation(...args);
}



export function uniffi_p2panda_ffi_checksum_method_event_body(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_event_body(...args);
}



export function uniffi_p2panda_ffi_checksum_method_event_header(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_event_header(...args);
}



export function uniffi_p2panda_ffi_checksum_method_event_is_completed(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_event_is_completed(...args);
}



export function uniffi_p2panda_ffi_checksum_method_event_is_failed(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_event_is_failed(...args);
}



export function uniffi_p2panda_ffi_checksum_method_processedoperation_ack(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_processedoperation_ack(...args);
}



export function uniffi_p2panda_ffi_checksum_method_processedoperation_author(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_processedoperation_author(...args);
}



export function uniffi_p2panda_ffi_checksum_method_processedoperation_id(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_processedoperation_id(...args);
}



export function uniffi_p2panda_ffi_checksum_method_processedoperation_message(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_processedoperation_message(...args);
}



export function uniffi_p2panda_ffi_checksum_method_processedoperation_processed(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_processedoperation_processed(...args);
}



export function uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp(...args);
}



export function uniffi_p2panda_ffi_checksum_method_processedoperation_topic(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_processedoperation_topic(...args);
}



export function uniffi_p2panda_ffi_checksum_method_topicstream_ack(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicstream_ack(...args);
}



export function uniffi_p2panda_ffi_checksum_method_topicstream_prune(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicstream_prune(...args);
}



export function uniffi_p2panda_ffi_checksum_method_topicstream_publish(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicstream_publish(...args);
}



export function uniffi_p2panda_ffi_checksum_method_topicstream_topic(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_method_topicstream_topic(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_hash_digest(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_hash_digest(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_hash_from_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_hash_from_hex(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_networkid_random(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_networkid_random(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_privatekey_generate(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_privatekey_generate(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_signature_from_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_signature_from_hex(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_topicid_random(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_topicid_random(...args);
}



export function uniffi_p2panda_ffi_checksum_constructor_node_spawn(...args) {
  return ffiFunctions.uniffi_p2panda_ffi_checksum_constructor_node_spawn(...args);
}



export function ffi_p2panda_ffi_uniffi_contract_version(...args) {
  return ffiFunctions.ffi_p2panda_ffi_uniffi_contract_version(...args);
}


