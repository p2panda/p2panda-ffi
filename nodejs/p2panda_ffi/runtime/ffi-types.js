import koffi from "koffi";
import {
  BufferOverflowError,
  ConverterRangeError,
  UnexpectedNullPointer,
} from "./errors.js";

export const UniffiHandle = "uint64_t";
export const VoidPointer = "void *";

export const RustBuffer = koffi.struct("RustBuffer", {
  capacity: "uint64_t",
  len: "uint64_t",
  data: VoidPointer,
});

export const ForeignBytes = koffi.struct("ForeignBytes", {
  len: "int32_t",
  data: VoidPointer,
});

export const RustCallStatus = koffi.struct("RustCallStatus", {
  code: "int8_t",
  error_buf: RustBuffer,
});

// Koffi keeps named type and prototype definitions process-wide. Reuse them
// across load/unload cycles so manual-load packages do not accumulate duplicates.
const NAMED_POINTER_TYPES = new Map();
const NAMED_STRUCT_TYPES = new Map();
const NAMED_CALLBACK_VTABLE_TYPES = new Map();
const NAMED_CALLBACK_PROTOTYPES = new Map();

const MAX_SAFE_LENGTH = BigInt(Number.MAX_SAFE_INTEGER);
const MAX_UINT64 = (1n << 64n) - 1n;
const MAX_INT64 = (1n << 63n) - 1n;
const MIN_INT64 = -(1n << 63n);
const MAX_FOREIGN_BYTES_LEN = 0x7fffffff;

export const RustCallStatusCodes = Object.freeze({
  SUCCESS: 0,
  ERROR: 1,
  UNEXPECTED_ERROR: 2,
  CANCELLED: 3,
});

export const EMPTY_RUST_BUFFER = Object.freeze({
  capacity: 0n,
  len: 0n,
  data: null,
});

export const EMPTY_FOREIGN_BYTES = Object.freeze({
  len: 0,
  data: null,
});

export const EMPTY_RUST_CALL_STATUS = Object.freeze({
  code: RustCallStatusCodes.SUCCESS,
  error_buf: EMPTY_RUST_BUFFER,
});

function bigintFromNumber(value, label) {
  if (!Number.isSafeInteger(value)) {
    throw new ConverterRangeError(
      `${label} must be a safe integer, got ${String(value)}.`,
    );
  }
  return BigInt(value);
}

function isByteSource(value) {
  return ArrayBuffer.isView(value) || value instanceof ArrayBuffer;
}

function normalizeByteSourceLength(value, label) {
  if (ArrayBuffer.isView(value)) {
    return value.byteLength;
  }
  if (value instanceof ArrayBuffer) {
    return value.byteLength;
  }
  throw new ConverterRangeError(`${label} is not backed by byte-addressable memory.`);
}

export function normalizeInt64(value) {
  if (value == null) {
    return value;
  }

  const normalized =
    typeof value === "bigint" ? value : bigintFromNumber(value, "int64");
  if (normalized < MIN_INT64 || normalized > MAX_INT64) {
    throw new ConverterRangeError(
      `int64 value ${String(value)} is outside the supported range.`,
    );
  }
  return normalized;
}

export function normalizeUInt64(value) {
  if (value == null) {
    return value;
  }

  const normalized =
    typeof value === "bigint" ? value : bigintFromNumber(value, "uint64");
  if (normalized < 0n || normalized > MAX_UINT64) {
    throw new ConverterRangeError(
      `uint64 value ${String(value)} is outside the supported range.`,
    );
  }
  return normalized;
}

export function normalizeHandle(value) {
  return normalizeUInt64(value);
}

function normalizeForeignBytesLength(value) {
  const normalized =
    typeof value === "bigint"
      ? value
      : bigintFromNumber(value, "ForeignBytes length");
  if (normalized < 0n || normalized > BigInt(MAX_FOREIGN_BYTES_LEN)) {
    throw new ConverterRangeError(
      `ForeignBytes length ${String(value)} is outside the supported int32 range.`,
    );
  }
  return Number(normalized);
}

export function pointerAddress(pointer) {
  if (pointer == null) {
    return 0n;
  }
  if (typeof pointer === "bigint" || typeof pointer === "number") {
    return normalizeUInt64(pointer);
  }
  return koffi.address(pointer);
}

export function isNullPointer(pointer) {
  if (pointer == null) {
    return true;
  }
  if (isByteSource(pointer)) {
    return normalizeByteSourceLength(pointer, "byte source") === 0;
  }
  return pointerAddress(pointer) === 0n;
}

export function assertSafeArrayLength(value, label = "length") {
  const normalized = normalizeUInt64(value);
  if (normalized > MAX_SAFE_LENGTH) {
    throw new ConverterRangeError(
      `${label} ${String(value)} exceeds Number.MAX_SAFE_INTEGER.`,
    );
  }
  return Number(normalized);
}

export function normalizeRustBuffer(buffer) {
  if (buffer == null) {
    return buffer;
  }

  const capacity = normalizeUInt64(buffer.capacity ?? 0);
  const len = normalizeUInt64(buffer.len ?? 0);
  const data = buffer.data ?? null;

  if (len > capacity) {
    throw new BufferOverflowError(
      `RustBuffer length ${String(len)} exceeds capacity ${String(capacity)}.`,
    );
  }
  if (data == null && (len !== 0n || capacity !== 0n)) {
    throw new UnexpectedNullPointer(
      "RustBuffer data is null but the buffer is not empty.",
    );
  }

  return {
    capacity,
    len,
    data,
  };
}

export function normalizeForeignBytes(bytes) {
  if (bytes == null) {
    return bytes;
  }

  const len = normalizeForeignBytesLength(bytes.len ?? 0);
  const data = bytes.data ?? null;
  if (data == null && len !== 0) {
    throw new UnexpectedNullPointer(
      "ForeignBytes data is null but the byte view is not empty.",
    );
  }

  return {
    len,
    data,
  };
}

export function normalizeRustCallStatus(status) {
  if (status == null) {
    return status;
  }

  return {
    code: status.code,
    error_buf: normalizeRustBuffer(status.error_buf) ?? EMPTY_RUST_BUFFER,
  };
}

export function createEmptyRustBuffer() {
  return EMPTY_RUST_BUFFER;
}

export function createRustBuffer(buffer = EMPTY_RUST_BUFFER) {
  return Object.freeze(normalizeRustBuffer(buffer) ?? EMPTY_RUST_BUFFER);
}

export function createForeignBytes(value = EMPTY_FOREIGN_BYTES) {
  if (value === EMPTY_FOREIGN_BYTES || value == null) {
    return EMPTY_FOREIGN_BYTES;
  }

  if (typeof value === "object" && "len" in value && "data" in value) {
    return Object.freeze(normalizeForeignBytes(value));
  }

  const bytes = coerceUint8Array(value);
  return Object.freeze({
    len: bytes.byteLength,
    data: bytes.byteLength === 0 ? null : bytes,
  });
}

export function createRustCallStatus(
  code = RustCallStatusCodes.SUCCESS,
  error_buf = EMPTY_RUST_BUFFER,
) {
  return Object.freeze({
    code,
    error_buf: normalizeRustBuffer(error_buf) ?? EMPTY_RUST_BUFFER,
  });
}

export function rustBufferNeedsFree(buffer) {
  const normalized = normalizeRustBuffer(buffer) ?? EMPTY_RUST_BUFFER;
  if (normalized.data == null) {
    return false;
  }
  if (isByteSource(normalized.data)) {
    return false;
  }
  return true;
}

export function coerceUint8Array(value, label = "bytes") {
  if (value == null) {
    return new Uint8Array();
  }
  if (value instanceof Uint8Array) {
    return value;
  }
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (Array.isArray(value)) {
    return Uint8Array.from(value);
  }
  throw new TypeError(`${label} must be an ArrayBuffer, TypedArray, or array of bytes.`);
}

export function copyUint8Array(value, label = "bytes") {
  return Uint8Array.from(coerceUint8Array(value, label));
}

export function viewPointerBytes(pointer, length, label = "pointer") {
  const byteLength = assertSafeArrayLength(length, `${label} length`);
  if (byteLength === 0) {
    return new Uint8Array();
  }

  if (isByteSource(pointer)) {
    const available = normalizeByteSourceLength(pointer, label);
    if (available < byteLength) {
      throw new BufferOverflowError(
        `${label} only contains ${available} byte(s), expected ${byteLength}.`,
      );
    }
    if (ArrayBuffer.isView(pointer)) {
      return new Uint8Array(pointer.buffer, pointer.byteOffset, byteLength);
    }
    return new Uint8Array(pointer, 0, byteLength);
  }

  if (isNullPointer(pointer)) {
    throw new UnexpectedNullPointer(`${label} is null.`);
  }

  const pointerBytes = koffi.view(pointer, byteLength);
  return Uint8Array.from(
    ArrayBuffer.isView(pointerBytes)
      ? pointerBytes
      : new Uint8Array(pointerBytes),
  );
}

export function readPointerBytes(pointer, length, label = "pointer") {
  const bytes = viewPointerBytes(pointer, length, label);
  return isByteSource(pointer)
    ? Uint8Array.from(bytes)
    : bytes;
}

export function readForeignBytes(bytes, label = "ForeignBytes") {
  const normalized = normalizeForeignBytes(bytes) ?? EMPTY_FOREIGN_BYTES;
  return readPointerBytes(normalized.data, normalized.len, label);
}

export function readRustBufferBytes(buffer, label = "RustBuffer") {
  const normalized = normalizeRustBuffer(buffer) ?? EMPTY_RUST_BUFFER;
  return readPointerBytes(normalized.data, normalized.len, label);
}

export function defineOpaquePointer(name) {
  return getOrCreateNamedType(
    NAMED_POINTER_TYPES,
    name,
    () => koffi.pointer(name, koffi.opaque()),
  );
}

export function defineStructType(name, fields) {
  return getOrCreateNamedType(
    NAMED_STRUCT_TYPES,
    name,
    () => koffi.struct(name, fields),
  );
}

export function defineCallbackVtable(name, fields) {
  return getOrCreateNamedType(
    NAMED_CALLBACK_VTABLE_TYPES,
    name,
    () => koffi.struct(name, fields),
  );
}

export function defineCallbackPrototype(name, returnType, argumentTypes) {
  return getOrCreateNamedType(
    NAMED_CALLBACK_PROTOTYPES,
    name,
    () => koffi.proto(name, returnType, argumentTypes),
  );
}

export class RustBufferValue {
  constructor(buffer = EMPTY_RUST_BUFFER) {
    this._buffer = normalizeRustBuffer(buffer) ?? EMPTY_RUST_BUFFER;
    this._released = false;
  }

  static empty() {
    return new RustBufferValue(EMPTY_RUST_BUFFER);
  }

  _requireBuffer() {
    if (this._released) {
      throw new UnexpectedNullPointer("RustBuffer has already been released.");
    }
    return this._buffer;
  }

  toStruct() {
    return createRustBuffer(this._requireBuffer());
  }

  isEmpty() {
    return this._requireBuffer().len === 0n;
  }

  byteLength() {
    return assertSafeArrayLength(this._requireBuffer().len, "RustBuffer length");
  }

  toUint8Array() {
    return readRustBufferBytes(this._requireBuffer());
  }

  free(freeRustBuffer) {
    const buffer = this._requireBuffer();
    if (rustBufferNeedsFree(buffer) && typeof freeRustBuffer !== "function") {
      throw new TypeError("freeRustBuffer must be a function when releasing a RustBuffer.");
    }

    this._released = true;
    this._buffer = EMPTY_RUST_BUFFER;

    if (rustBufferNeedsFree(buffer)) {
      freeRustBuffer(buffer);
    }
    return true;
  }

  consumeIntoUint8Array(freeRustBuffer) {
    const bytes = this.toUint8Array();
    this.free(freeRustBuffer);
    return bytes;
  }
}

export class ForeignBytesValue {
  constructor(bytes = EMPTY_FOREIGN_BYTES) {
    this._bytes = normalizeForeignBytes(bytes) ?? EMPTY_FOREIGN_BYTES;
  }

  static empty() {
    return new ForeignBytesValue(EMPTY_FOREIGN_BYTES);
  }

  toStruct() {
    return createForeignBytes(this._bytes);
  }

  isEmpty() {
    return this._bytes.len === 0;
  }

  byteLength() {
    return this._bytes.len;
  }

  toUint8Array() {
    return readForeignBytes(this._bytes);
  }
}

function getOrCreateNamedType(cache, name, create) {
  let type = cache.get(name);
  if (type == null) {
    type = create();
    cache.set(name, type);
  }
  return type;
}