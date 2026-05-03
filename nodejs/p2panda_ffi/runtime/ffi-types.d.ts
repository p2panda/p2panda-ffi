export declare const UniffiHandle: "uint64_t";
export declare const VoidPointer: "void *";
export declare const RustBuffer: unknown;
export declare const ForeignBytes: unknown;
export declare const RustCallStatus: unknown;

export interface RustBufferStruct {
  capacity: bigint;
  len: bigint;
  data: unknown | null;
}

export interface ForeignBytesStruct {
  len: number;
  data: unknown | null;
}

export interface RustCallStatusStruct {
  code: number;
  error_buf: RustBufferStruct;
}

export declare const RustCallStatusCodes: Readonly<{
  SUCCESS: 0;
  ERROR: 1;
  UNEXPECTED_ERROR: 2;
  CANCELLED: 3;
}>;

export declare const EMPTY_RUST_BUFFER: Readonly<RustBufferStruct>;
export declare const EMPTY_FOREIGN_BYTES: Readonly<ForeignBytesStruct>;
export declare const EMPTY_RUST_CALL_STATUS: Readonly<RustCallStatusStruct>;

export declare function normalizeInt64(value: bigint | number | null | undefined): bigint | null | undefined;
export declare function normalizeUInt64(value: bigint | number | null | undefined): bigint | null | undefined;
export declare function normalizeHandle(value: bigint | number | null | undefined): bigint | null | undefined;
export declare function pointerAddress(pointer: unknown | null | undefined): bigint;
export declare function isNullPointer(pointer: unknown | null | undefined): boolean;
export declare function assertSafeArrayLength(value: bigint | number, label?: string): number;
export declare function normalizeRustBuffer(
  buffer: RustBufferStruct | null | undefined,
): RustBufferStruct | null | undefined;
export declare function normalizeForeignBytes(
  bytes: ForeignBytesStruct | null | undefined,
): ForeignBytesStruct | null | undefined;
export declare function normalizeRustCallStatus(
  status: RustCallStatusStruct | null | undefined,
): RustCallStatusStruct | null | undefined;
export declare function createEmptyRustBuffer(): Readonly<RustBufferStruct>;
export declare function createRustBuffer(
  buffer?: RustBufferStruct | null,
): Readonly<RustBufferStruct>;
export declare function createForeignBytes(
  value?: ForeignBytesStruct | ArrayBuffer | ArrayBufferView | number[] | null,
): Readonly<ForeignBytesStruct>;
export declare function createRustCallStatus(
  code?: number,
  error_buf?: RustBufferStruct | null,
): Readonly<RustCallStatusStruct>;
export declare function rustBufferNeedsFree(buffer: RustBufferStruct | null | undefined): boolean;
export declare function coerceUint8Array(
  value: ArrayBuffer | ArrayBufferView | number[] | null | undefined,
  label?: string,
): Uint8Array;
export declare function copyUint8Array(
  value: ArrayBuffer | ArrayBufferView | number[] | null | undefined,
  label?: string,
): Uint8Array;
export declare function viewPointerBytes(
  pointer: unknown | null | undefined,
  length: bigint | number,
  label?: string,
): Uint8Array;
export declare function readPointerBytes(
  pointer: unknown | null | undefined,
  length: bigint | number,
  label?: string,
): Uint8Array;
export declare function readForeignBytes(
  bytes: ForeignBytesStruct | null | undefined,
  label?: string,
): Uint8Array;
export declare function readRustBufferBytes(
  buffer: RustBufferStruct | null | undefined,
  label?: string,
): Uint8Array;
export declare function defineOpaquePointer(name: string): unknown;
export declare function defineStructType(
  name: string,
  fields: Readonly<Record<string, unknown>>,
): unknown;
export declare function defineCallbackVtable(
  name: string,
  fields: Readonly<Record<string, unknown>>,
): unknown;
export declare function defineCallbackPrototype(
  name: string,
  returnType: unknown,
  argumentTypes: ReadonlyArray<unknown>,
): unknown;

export declare class RustBufferValue {
  constructor(buffer?: RustBufferStruct | null);
  static empty(): RustBufferValue;
  toStruct(): Readonly<RustBufferStruct>;
  isEmpty(): boolean;
  byteLength(): number;
  toUint8Array(): Uint8Array;
  free(freeRustBuffer: (buffer: RustBufferStruct) => void): boolean;
  consumeIntoUint8Array(freeRustBuffer: (buffer: RustBufferStruct) => void): Uint8Array;
}

export declare class ForeignBytesValue {
  constructor(bytes?: ForeignBytesStruct | null);
  static empty(): ForeignBytesValue;
  toStruct(): Readonly<ForeignBytesStruct>;
  isEmpty(): boolean;
  byteLength(): number;
  toUint8Array(): Uint8Array;
}