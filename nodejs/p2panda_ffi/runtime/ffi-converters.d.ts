export type UniffiTimestamp = Date;
export type UniffiDuration = number;

export interface FfiConverter<T, FfiType = T> {
  allocationSize(value: T): number;
  lower(value: T): FfiType;
  lift(value: FfiType): T;
  write(value: T, writer: ByteWriter): void;
  read(reader: ByteReader): T;
}

export declare class ByteWriter {
  constructor(length: number);
  remaining(): number;
  writeInt8(value: number): void;
  writeUInt8(value: number): void;
  writeInt16(value: number): void;
  writeUInt16(value: number): void;
  writeInt32(value: number): void;
  writeUInt32(value: number): void;
  writeInt64(value: bigint | number): void;
  writeUInt64(value: bigint | number): void;
  writeFloat32(value: number): void;
  writeFloat64(value: number): void;
  writeBytes(value: ArrayBuffer | ArrayBufferView | number[]): void;
  finish(): Uint8Array;
}

export declare class ByteReader {
  constructor(bytes: ArrayBuffer | ArrayBufferView);
  remaining(): number;
  readInt8(): number;
  readUInt8(): number;
  readInt16(): number;
  readUInt16(): number;
  readInt32(): number;
  readUInt32(): number;
  readInt64(): bigint;
  readUInt64(): bigint;
  readFloat32(): number;
  readFloat64(): number;
  readBytes(length: number): Uint8Array;
  readCount(label: string): number;
  finish(): void;
}

export declare abstract class AbstractFfiConverterByteArray<T>
  implements FfiConverter<T, Uint8Array>
{
  abstract allocationSize(value: T): number;
  lower(value: T): Uint8Array;
  lift(value: ArrayBuffer | ArrayBufferView): T;
  abstract write(value: T, writer: ByteWriter): void;
  abstract read(reader: ByteReader): T;
}

export declare const FfiConverterInt8: Readonly<FfiConverter<number>>;
export declare const FfiConverterUInt8: Readonly<FfiConverter<number>>;
export declare const FfiConverterInt16: Readonly<FfiConverter<number>>;
export declare const FfiConverterUInt16: Readonly<FfiConverter<number>>;
export declare const FfiConverterInt32: Readonly<FfiConverter<number>>;
export declare const FfiConverterUInt32: Readonly<FfiConverter<number>>;
export declare const FfiConverterInt64: Readonly<FfiConverter<bigint, bigint>>;
export declare const FfiConverterUInt64: Readonly<FfiConverter<bigint, bigint>>;
export declare const FfiConverterFloat32: Readonly<FfiConverter<number>>;
export declare const FfiConverterFloat64: Readonly<FfiConverter<number>>;
export declare const FfiConverterBool: Readonly<FfiConverter<boolean, number>>;
export declare const FfiConverterString: Readonly<FfiConverter<string, Uint8Array>>;
export declare const FfiConverterBytes: Readonly<FfiConverter<Uint8Array, Uint8Array>>;
export declare const FfiConverterByteArray: typeof FfiConverterBytes;
export declare const FfiConverterArrayBuffer: typeof FfiConverterBytes;
export declare const FfiConverterTimestamp: Readonly<
  FfiConverter<UniffiTimestamp, Uint8Array>
>;
export declare const FfiConverterDuration: Readonly<
  FfiConverter<UniffiDuration, Uint8Array>
>;

export declare class FfiConverterOptional<T> extends AbstractFfiConverterByteArray<T | undefined> {
  constructor(innerConverter: FfiConverter<T, any>);
  allocationSize(value: T | null | undefined): number;
  write(value: T | null | undefined, writer: ByteWriter): void;
  read(reader: ByteReader): T | undefined;
}

export declare class FfiConverterArray<T> extends AbstractFfiConverterByteArray<T[]> {
  constructor(innerConverter: FfiConverter<T, any>);
  allocationSize(value: Iterable<T> | T[]): number;
  write(value: Iterable<T> | T[], writer: ByteWriter): void;
  read(reader: ByteReader): T[];
}

export declare const FfiConverterSequence: typeof FfiConverterArray;

export declare class FfiConverterMap<K, V> extends AbstractFfiConverterByteArray<Map<K, V>> {
  constructor(keyConverter: FfiConverter<K, any>, valueConverter: FfiConverter<V, any>);
  allocationSize(value: Map<K, V> | Iterable<[K, V]>): number;
  write(value: Map<K, V> | Iterable<[K, V]>, writer: ByteWriter): void;
  read(reader: ByteReader): Map<K, V>;
}