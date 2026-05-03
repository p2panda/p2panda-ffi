import type { ByteReader, ByteWriter } from "./ffi-converters.js";

export declare const uniffiTypeNameSymbol: unique symbol;
export declare const uniffiObjectFactorySymbol: unique symbol;
export declare const uniffiObjectHandleSymbol: unique symbol;
export declare const uniffiObjectDestroyedSymbol: unique symbol;
export declare const UNIFFI_OBJECT_HANDLE_SIZE: 8;

export interface UniffiObjectFactoryOptions<T extends object = UniffiObjectBase> {
  typeName?: string;
  createInstance?: () => T;
  cloneFreeUsesUniffiHandle?: boolean | null;
  cloneHandle?: ((handle: unknown, value: T) => unknown) | null;
  cloneHandleGeneric?: ((handle: unknown, value: T) => unknown) | null;
  cloneHandleRawExternal?: ((handle: unknown, value: T) => unknown) | null;
  freeHandle?: ((handle: unknown, value?: T) => void) | null;
  freeHandleGeneric?: ((handle: unknown, value?: T) => void) | null;
  freeHandleRawExternal?: ((handle: unknown, value?: T) => void) | null;
  handleType?: unknown | (() => unknown) | null;
  serializeHandle?: ((handle: unknown, value: T) => bigint | number) | null;
  deserializeHandle?: ((handle: bigint | number) => unknown) | null;
}

export declare class UniffiObjectBase {
  readonly [uniffiTypeNameSymbol]?: string;
  readonly [uniffiObjectHandleSymbol]?: unknown;
  readonly [uniffiObjectDestroyedSymbol]?: boolean;
  get uniffiTypeName(): string;
  get uniffiHandle(): unknown;
  uniffiDestroy(): boolean;
  dispose(): boolean;
}

export declare class UniffiObjectFactory<T extends object = UniffiObjectBase> {
  readonly typeName: string;
  constructor(options?: UniffiObjectFactoryOptions<T>);
  attach(instance: T, handle: unknown): T;
  bless(instance: T, handle: unknown): T;
  create(handle: unknown): T;
  createGenericAbi(handle: unknown): T;
  createRawExternal(handle: unknown): T;
  handle(value: T): unknown;
  peekHandle(value: unknown): unknown;
  cloneHandle(value: T): unknown;
  destroy(value: unknown): boolean;
  isInstance(value: unknown): value is T;
  isDestroyed(value: unknown): boolean;
  usesRawExternal(value: unknown): boolean;
  serializeHandle(value: T): bigint;
  deserializeHandle(serialized: bigint | number): unknown;
}

export declare class FfiConverterObject<T extends object = UniffiObjectBase> {
  readonly factory: UniffiObjectFactory<T>;
  constructor(factory: UniffiObjectFactory<T>);
  lower(value: T): bigint;
  lift(handle: bigint | number): T;
  write(value: T, writer: ByteWriter): void;
  read(reader: ByteReader): T;
  allocationSize(value?: T): 8;
}

export declare function createObjectFactory<T extends object = UniffiObjectBase>(
  options?: UniffiObjectFactoryOptions<T>,
): UniffiObjectFactory<T>;
export declare function createObjectConverter<T extends object = UniffiObjectBase>(
  factory: UniffiObjectFactory<T>,
): FfiConverterObject<T>;