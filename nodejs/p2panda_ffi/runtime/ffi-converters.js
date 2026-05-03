import {
  BufferOverflowError,
  BufferSizeMismatchError,
  ConverterRangeError,
  TrailingBytesError,
  UnexpectedOptionTag,
} from "./errors.js";
import {
  coerceUint8Array,
  normalizeInt64,
  normalizeUInt64,
} from "./ffi-types.js";

const MAX_COLLECTION_LEN = 0x7fffffff;
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MAX_DATE_MILLISECONDS = 8640000000000000n;
const UTF8_ENCODER = new TextEncoder();
const UTF8_DECODER = new TextDecoder();

function toSafeNumber(value, label) {
  if (value < -MAX_SAFE_BIGINT || value > MAX_SAFE_BIGINT) {
    throw new ConverterRangeError(
      `${label} ${String(value)} exceeds Number.MAX_SAFE_INTEGER.`,
    );
  }
  return Number(value);
}

function normalizeCollectionLength(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_COLLECTION_LEN) {
    throw new ConverterRangeError(
      `${label} must be an integer between 0 and ${MAX_COLLECTION_LEN}.`,
    );
  }
  return value;
}

function normalizeSignedInteger(value, label, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ConverterRangeError(
      `${label} must be an integer between ${min} and ${max}.`,
    );
  }
  return value;
}

function normalizeFloat(value, label) {
  if (typeof value !== "number") {
    throw new TypeError(`${label} must be a number.`);
  }
  return value;
}

function normalizeBoolean(value, label) {
  if (typeof value !== "boolean") {
    throw new TypeError(`${label} must be a boolean.`);
  }
  return value;
}

function normalizeDate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new TypeError("timestamp values must be valid Date instances.");
  }
  return value;
}

function normalizeDurationMilliseconds(value) {
  if (typeof value === "bigint") {
    if (value < 0n) {
      throw new ConverterRangeError("duration values cannot be negative.");
    }
    return value;
  }
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    throw new ConverterRangeError(
      "duration values must be non-negative integer millisecond counts.",
    );
  }
  return BigInt(value);
}

function encodeUtf8(value) {
  if (typeof value !== "string") {
    throw new TypeError("string values must be strings.");
  }
  return UTF8_ENCODER.encode(value);
}

function decodeUtf8(bytes) {
  return UTF8_DECODER.decode(bytes);
}

export class ByteWriter {
  constructor(length) {
    const byteLength = normalizeCollectionLength(length, "serialized byte length");
    this._bytes = new Uint8Array(byteLength);
    this._view = new DataView(this._bytes.buffer);
    this._offset = 0;
  }

  remaining() {
    return this._bytes.byteLength - this._offset;
  }

  _ensureAvailable(byteLength) {
    if (this.remaining() < byteLength) {
      throw new BufferOverflowError(
        `Tried to write ${byteLength} byte(s) with only ${this.remaining()} remaining.`,
      );
    }
  }

  writeInt8(value) {
    this._ensureAvailable(1);
    this._view.setInt8(this._offset, normalizeSignedInteger(value, "i8", -128, 127));
    this._offset += 1;
  }

  writeUInt8(value) {
    this._ensureAvailable(1);
    this._view.setUint8(this._offset, normalizeSignedInteger(value, "u8", 0, 0xff));
    this._offset += 1;
  }

  writeInt16(value) {
    this._ensureAvailable(2);
    this._view.setInt16(this._offset, normalizeSignedInteger(value, "i16", -0x8000, 0x7fff));
    this._offset += 2;
  }

  writeUInt16(value) {
    this._ensureAvailable(2);
    this._view.setUint16(this._offset, normalizeSignedInteger(value, "u16", 0, 0xffff));
    this._offset += 2;
  }

  writeInt32(value) {
    this._ensureAvailable(4);
    this._view.setInt32(
      this._offset,
      normalizeSignedInteger(value, "i32", -0x80000000, 0x7fffffff),
    );
    this._offset += 4;
  }

  writeUInt32(value) {
    this._ensureAvailable(4);
    this._view.setUint32(this._offset, normalizeSignedInteger(value, "u32", 0, 0xffffffff));
    this._offset += 4;
  }

  writeInt64(value) {
    this._ensureAvailable(8);
    this._view.setBigInt64(this._offset, normalizeInt64(value));
    this._offset += 8;
  }

  writeUInt64(value) {
    this._ensureAvailable(8);
    this._view.setBigUint64(this._offset, normalizeUInt64(value));
    this._offset += 8;
  }

  writeFloat32(value) {
    this._ensureAvailable(4);
    this._view.setFloat32(this._offset, normalizeFloat(value, "f32"));
    this._offset += 4;
  }

  writeFloat64(value) {
    this._ensureAvailable(8);
    this._view.setFloat64(this._offset, normalizeFloat(value, "f64"));
    this._offset += 8;
  }

  writeBytes(value) {
    const bytes = coerceUint8Array(value, "serialized bytes");
    this._ensureAvailable(bytes.byteLength);
    this._bytes.set(bytes, this._offset);
    this._offset += bytes.byteLength;
  }

  finish() {
    if (this._offset !== this._bytes.byteLength) {
      throw new BufferSizeMismatchError(this._bytes.byteLength, this._offset);
    }
    return this._bytes;
  }
}

export class ByteReader {
  constructor(bytes) {
    this._bytes = coerceUint8Array(bytes, "serialized bytes");
    this._view = new DataView(
      this._bytes.buffer,
      this._bytes.byteOffset,
      this._bytes.byteLength,
    );
    this._offset = 0;
  }

  remaining() {
    return this._bytes.byteLength - this._offset;
  }

  _ensureAvailable(byteLength) {
    if (this.remaining() < byteLength) {
      throw new BufferOverflowError(
        `Tried to read ${byteLength} byte(s) with only ${this.remaining()} remaining.`,
      );
    }
  }

  readInt8() {
    this._ensureAvailable(1);
    const value = this._view.getInt8(this._offset);
    this._offset += 1;
    return value;
  }

  readUInt8() {
    this._ensureAvailable(1);
    const value = this._view.getUint8(this._offset);
    this._offset += 1;
    return value;
  }

  readInt16() {
    this._ensureAvailable(2);
    const value = this._view.getInt16(this._offset);
    this._offset += 2;
    return value;
  }

  readUInt16() {
    this._ensureAvailable(2);
    const value = this._view.getUint16(this._offset);
    this._offset += 2;
    return value;
  }

  readInt32() {
    this._ensureAvailable(4);
    const value = this._view.getInt32(this._offset);
    this._offset += 4;
    return value;
  }

  readUInt32() {
    this._ensureAvailable(4);
    const value = this._view.getUint32(this._offset);
    this._offset += 4;
    return value;
  }

  readInt64() {
    this._ensureAvailable(8);
    const value = this._view.getBigInt64(this._offset);
    this._offset += 8;
    return value;
  }

  readUInt64() {
    this._ensureAvailable(8);
    const value = this._view.getBigUint64(this._offset);
    this._offset += 8;
    return value;
  }

  readFloat32() {
    this._ensureAvailable(4);
    const value = this._view.getFloat32(this._offset);
    this._offset += 4;
    return value;
  }

  readFloat64() {
    this._ensureAvailable(8);
    const value = this._view.getFloat64(this._offset);
    this._offset += 8;
    return value;
  }

  readBytes(length) {
    const byteLength = normalizeCollectionLength(length, "byte length");
    this._ensureAvailable(byteLength);
    const start = this._offset;
    const end = this._offset + byteLength;
    this._offset = end;
    return this._bytes.subarray(start, end);
  }

  readCount(label) {
    const count = this.readInt32();
    if (count < 0) {
      throw new ConverterRangeError(`${label} cannot be negative.`);
    }
    return count;
  }

  finish() {
    if (this.remaining() !== 0) {
      throw new TrailingBytesError(this.remaining());
    }
  }
}

export class AbstractFfiConverterByteArray {
  lower(value) {
    const writer = new ByteWriter(this.allocationSize(value));
    this.write(value, writer);
    return writer.finish();
  }

  lift(value) {
    const reader = new ByteReader(value);
    const result = this.read(reader);
    reader.finish();
    return result;
  }
}

function createPrimitiveConverter({ lower, lift, write, read, size }) {
  return Object.freeze({
    lower,
    lift,
    write,
    read,
    allocationSize() {
      return size;
    },
  });
}

export const FfiConverterInt8 = createPrimitiveConverter({
  lower(value) {
    return normalizeSignedInteger(value, "i8", -128, 127);
  },
  lift(value) {
    return normalizeSignedInteger(value, "i8", -128, 127);
  },
  write(value, writer) {
    writer.writeInt8(value);
  },
  read(reader) {
    return reader.readInt8();
  },
  size: 1,
});

export const FfiConverterUInt8 = createPrimitiveConverter({
  lower(value) {
    return normalizeSignedInteger(value, "u8", 0, 0xff);
  },
  lift(value) {
    return normalizeSignedInteger(value, "u8", 0, 0xff);
  },
  write(value, writer) {
    writer.writeUInt8(value);
  },
  read(reader) {
    return reader.readUInt8();
  },
  size: 1,
});

export const FfiConverterInt16 = createPrimitiveConverter({
  lower(value) {
    return normalizeSignedInteger(value, "i16", -0x8000, 0x7fff);
  },
  lift(value) {
    return normalizeSignedInteger(value, "i16", -0x8000, 0x7fff);
  },
  write(value, writer) {
    writer.writeInt16(value);
  },
  read(reader) {
    return reader.readInt16();
  },
  size: 2,
});

export const FfiConverterUInt16 = createPrimitiveConverter({
  lower(value) {
    return normalizeSignedInteger(value, "u16", 0, 0xffff);
  },
  lift(value) {
    return normalizeSignedInteger(value, "u16", 0, 0xffff);
  },
  write(value, writer) {
    writer.writeUInt16(value);
  },
  read(reader) {
    return reader.readUInt16();
  },
  size: 2,
});

export const FfiConverterInt32 = createPrimitiveConverter({
  lower(value) {
    return normalizeSignedInteger(value, "i32", -0x80000000, 0x7fffffff);
  },
  lift(value) {
    return normalizeSignedInteger(value, "i32", -0x80000000, 0x7fffffff);
  },
  write(value, writer) {
    writer.writeInt32(value);
  },
  read(reader) {
    return reader.readInt32();
  },
  size: 4,
});

export const FfiConverterUInt32 = createPrimitiveConverter({
  lower(value) {
    return normalizeSignedInteger(value, "u32", 0, 0xffffffff);
  },
  lift(value) {
    return normalizeSignedInteger(value, "u32", 0, 0xffffffff);
  },
  write(value, writer) {
    writer.writeUInt32(value);
  },
  read(reader) {
    return reader.readUInt32();
  },
  size: 4,
});

export const FfiConverterInt64 = createPrimitiveConverter({
  lower(value) {
    return normalizeInt64(value);
  },
  lift(value) {
    return normalizeInt64(value);
  },
  write(value, writer) {
    writer.writeInt64(value);
  },
  read(reader) {
    return reader.readInt64();
  },
  size: 8,
});

export const FfiConverterUInt64 = createPrimitiveConverter({
  lower(value) {
    return normalizeUInt64(value);
  },
  lift(value) {
    return normalizeUInt64(value);
  },
  write(value, writer) {
    writer.writeUInt64(value);
  },
  read(reader) {
    return reader.readUInt64();
  },
  size: 8,
});

export const FfiConverterFloat32 = createPrimitiveConverter({
  lower(value) {
    return normalizeFloat(value, "f32");
  },
  lift(value) {
    return normalizeFloat(value, "f32");
  },
  write(value, writer) {
    writer.writeFloat32(value);
  },
  read(reader) {
    return reader.readFloat32();
  },
  size: 4,
});

export const FfiConverterFloat64 = createPrimitiveConverter({
  lower(value) {
    return normalizeFloat(value, "f64");
  },
  lift(value) {
    return normalizeFloat(value, "f64");
  },
  write(value, writer) {
    writer.writeFloat64(value);
  },
  read(reader) {
    return reader.readFloat64();
  },
  size: 8,
});

export const FfiConverterBool = createPrimitiveConverter({
  lower(value) {
    return normalizeBoolean(value, "bool") ? 1 : 0;
  },
  lift(value) {
    switch (value) {
      case 0:
        return false;
      case 1:
        return true;
      default:
        throw new ConverterRangeError(
          `bool values must be encoded as 0 or 1, got ${String(value)}.`,
        );
    }
  },
  write(value, writer) {
    writer.writeInt8(normalizeBoolean(value, "bool") ? 1 : 0);
  },
  read(reader) {
    return FfiConverterBool.lift(reader.readInt8());
  },
  size: 1,
});

export const FfiConverterString = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    return 4 + encodeUtf8(value).byteLength;
  }

  write(value, writer) {
    const bytes = encodeUtf8(value);
    writer.writeInt32(normalizeCollectionLength(bytes.byteLength, "string byte length"));
    writer.writeBytes(bytes);
  }

  read(reader) {
    return decodeUtf8(reader.readBytes(reader.readCount("string byte length")));
  }
})();

export const FfiConverterBytes = new (class extends AbstractFfiConverterByteArray {
  allocationSize(value) {
    return 4 + coerceUint8Array(value, "byte array").byteLength;
  }

  write(value, writer) {
    const bytes = coerceUint8Array(value, "byte array");
    writer.writeInt32(normalizeCollectionLength(bytes.byteLength, "byte array length"));
    writer.writeBytes(bytes);
  }

  read(reader) {
    return reader.readBytes(reader.readCount("byte array length"));
  }
})();

export const FfiConverterByteArray = FfiConverterBytes;
export const FfiConverterArrayBuffer = FfiConverterBytes;

export const FfiConverterTimestamp = new (class extends AbstractFfiConverterByteArray {
  allocationSize() {
    return 12;
  }

  write(value, writer) {
    const timestamp = normalizeDate(value);
    const milliseconds = BigInt(timestamp.getTime());
    const negative = milliseconds < 0n;
    const magnitude = negative ? -milliseconds : milliseconds;
    const seconds = magnitude / 1000n;
    const nanos = Number((magnitude % 1000n) * 1000000n);

    writer.writeInt64(negative ? -seconds : seconds);
    writer.writeUInt32(nanos);
  }

  read(reader) {
    const seconds = reader.readInt64();
    const nanos = reader.readUInt32();
    if (nanos > 999999999) {
      throw new ConverterRangeError(
        `timestamp nanosecond component ${String(nanos)} is out of range.`,
      );
    }

    const magnitudeMs = (seconds < 0n ? -seconds : seconds) * 1000n + BigInt(nanos / 1000000);
    if (magnitudeMs > MAX_DATE_MILLISECONDS) {
      throw new ConverterRangeError(
        `timestamp ${String(magnitudeMs)}ms exceeds the supported Date range.`,
      );
    }

    return new Date(seconds < 0n ? -Number(magnitudeMs) : Number(magnitudeMs));
  }
})();

export const FfiConverterDuration = new (class extends AbstractFfiConverterByteArray {
  allocationSize() {
    return 12;
  }

  write(value, writer) {
    const milliseconds = normalizeDurationMilliseconds(value);
    const seconds = milliseconds / 1000n;
    const nanos = Number((milliseconds % 1000n) * 1000000n);

    writer.writeUInt64(seconds);
    writer.writeUInt32(nanos);
  }

  read(reader) {
    const seconds = reader.readUInt64();
    const nanos = reader.readUInt32();
    if (nanos > 999999999) {
      throw new ConverterRangeError(
        `duration nanosecond component ${String(nanos)} is out of range.`,
      );
    }

    return toSafeNumber(seconds * 1000n, "duration milliseconds") + nanos / 1000000;
  }
})();

export class FfiConverterOptional extends AbstractFfiConverterByteArray {
  constructor(innerConverter) {
    super();
    this.innerConverter = innerConverter;
  }

  allocationSize(value) {
    if (value == null) {
      return 1;
    }
    return 1 + this.innerConverter.allocationSize(value);
  }

  write(value, writer) {
    if (value == null) {
      writer.writeInt8(0);
      return;
    }
    writer.writeInt8(1);
    this.innerConverter.write(value, writer);
  }

  read(reader) {
    const tag = reader.readInt8();
    switch (tag) {
      case 0:
        return undefined;
      case 1:
        return this.innerConverter.read(reader);
      default:
        throw new UnexpectedOptionTag(tag);
    }
  }
}

function normalizeSequence(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value != null && typeof value !== "string" && typeof value[Symbol.iterator] === "function") {
    return Array.from(value);
  }
  throw new TypeError("sequence values must be arrays or iterable collections.");
}

export class FfiConverterArray extends AbstractFfiConverterByteArray {
  constructor(innerConverter) {
    super();
    this.innerConverter = innerConverter;
  }

  allocationSize(value) {
    const items = normalizeSequence(value);
    return (
      4 +
      items.reduce(
        (total, item) => total + this.innerConverter.allocationSize(item),
        0,
      )
    );
  }

  write(value, writer) {
    const items = normalizeSequence(value);
    writer.writeInt32(normalizeCollectionLength(items.length, "sequence length"));
    for (const item of items) {
      this.innerConverter.write(item, writer);
    }
  }

  read(reader) {
    const itemCount = reader.readCount("sequence length");
    const items = new Array(itemCount);
    for (let index = 0; index < itemCount; index += 1) {
      items[index] = this.innerConverter.read(reader);
    }
    return items;
  }
}

export const FfiConverterSequence = FfiConverterArray;

function normalizeEntries(value) {
  if (value instanceof Map) {
    return Array.from(value.entries());
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (value != null && typeof value[Symbol.iterator] === "function") {
    return Array.from(value);
  }
  throw new TypeError("map values must be Maps or iterable entry collections.");
}

export class FfiConverterMap extends AbstractFfiConverterByteArray {
  constructor(keyConverter, valueConverter) {
    super();
    this.keyConverter = keyConverter;
    this.valueConverter = valueConverter;
  }

  allocationSize(value) {
    const entries = normalizeEntries(value);
    return entries.reduce((total, entry) => {
      if (!Array.isArray(entry) || entry.length !== 2) {
        throw new TypeError("map entries must be two-item [key, value] pairs.");
      }
      return (
        total +
        this.keyConverter.allocationSize(entry[0]) +
        this.valueConverter.allocationSize(entry[1])
      );
    }, 4);
  }

  write(value, writer) {
    const entries = normalizeEntries(value);
    writer.writeInt32(normalizeCollectionLength(entries.length, "map length"));
    for (const entry of entries) {
      if (!Array.isArray(entry) || entry.length !== 2) {
        throw new TypeError("map entries must be two-item [key, value] pairs.");
      }
      this.keyConverter.write(entry[0], writer);
      this.valueConverter.write(entry[1], writer);
    }
  }

  read(reader) {
    const entryCount = reader.readCount("map length");
    const map = new Map();
    for (let index = 0; index < entryCount; index += 1) {
      const key = this.keyConverter.read(reader);
      const value = this.valueConverter.read(reader);
      map.set(key, value);
    }
    return map;
  }
}