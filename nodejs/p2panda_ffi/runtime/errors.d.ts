export interface UniffiErrorOptions {
  cause?: unknown;
  code?: string | number;
  details?: unknown;
}

export declare class UniffiError extends Error {
  cause?: unknown;
  code?: string | number;
  details?: unknown;
  constructor(message?: string, options?: UniffiErrorOptions);
}

export declare class UniffiGeneratedError extends UniffiError {}

export declare class UniffiRuntimeError extends UniffiError {}

export declare class RustPanic extends UniffiRuntimeError {
  constructor(message?: string, options?: UniffiErrorOptions);
}

export declare class AbortError extends UniffiRuntimeError {
  constructor(message?: string, options?: UniffiErrorOptions);
}

export declare class LibraryNotLoadedError extends UniffiRuntimeError {
  constructor(message?: string, options?: UniffiErrorOptions);
}

export declare class ContractVersionMismatchError extends UniffiRuntimeError {
  constructor(expected: bigint | number, actual: bigint | number, options?: UniffiErrorOptions);
}

export declare class ChecksumMismatchError extends UniffiRuntimeError {
  constructor(
    kind: string,
    expected: bigint | number | string,
    actual: bigint | number | string,
    options?: UniffiErrorOptions,
  );
}

export declare class UnexpectedRustCallError extends UniffiRuntimeError {
  constructor(message?: string, options?: UniffiErrorOptions);
}

export declare class UnexpectedRustCallStatusCode extends UniffiRuntimeError {
  constructor(code: bigint | number | string, options?: UniffiErrorOptions);
}

export declare class UnexpectedEnumCase extends UniffiRuntimeError {
  constructor(message?: string, options?: UniffiErrorOptions);
}

export declare class UnexpectedNullPointer extends UniffiRuntimeError {
  constructor(message?: string, options?: UniffiErrorOptions);
}

export declare class UnexpectedOptionTag extends UniffiRuntimeError {
  constructor(tag: bigint | number | string, options?: UniffiErrorOptions);
}

export declare class ConverterRangeError extends UniffiRuntimeError {
  constructor(message?: string, options?: UniffiErrorOptions);
}

export declare class BufferOverflowError extends UniffiRuntimeError {
  constructor(message?: string, options?: UniffiErrorOptions);
}

export declare class BufferSizeMismatchError extends UniffiRuntimeError {
  constructor(expected: bigint | number, actual: bigint | number, options?: UniffiErrorOptions);
}

export declare class TrailingBytesError extends UniffiRuntimeError {
  constructor(remaining: bigint | number, options?: UniffiErrorOptions);
}

export declare class DuplicateHandleError extends UniffiRuntimeError {
  constructor(handle: bigint | number | string, options?: UniffiErrorOptions);
}

export declare class StaleHandleError extends UniffiRuntimeError {
  constructor(handle: bigint | number | string, options?: UniffiErrorOptions);
}

export declare class UnsupportedConverterError extends UniffiRuntimeError {
  constructor(message?: string, options?: UniffiErrorOptions);
}

export declare function attachCause<T extends Error>(error: T, cause: unknown): T;
export declare function getErrorMessage(value: unknown, fallbackMessage?: string): string;
export declare function ensureError(value: unknown, fallbackMessage?: string): Error;
export declare function createUniffiErrorClass(
  name: string,
  options?: {
    baseClass?: typeof UniffiGeneratedError;
    defaultMessage?: string;
  },
): new (message?: string, options?: UniffiErrorOptions) => UniffiGeneratedError;

export declare const UniffiInternalError: Readonly<{
  AbortError: typeof AbortError;
  BufferOverflowError: typeof BufferOverflowError;
  BufferSizeMismatchError: typeof BufferSizeMismatchError;
  ChecksumMismatchError: typeof ChecksumMismatchError;
  ContractVersionMismatchError: typeof ContractVersionMismatchError;
  ConverterRangeError: typeof ConverterRangeError;
  DuplicateHandleError: typeof DuplicateHandleError;
  LibraryNotLoadedError: typeof LibraryNotLoadedError;
  RustPanic: typeof RustPanic;
  StaleHandleError: typeof StaleHandleError;
  TrailingBytesError: typeof TrailingBytesError;
  UnexpectedEnumCase: typeof UnexpectedEnumCase;
  UnexpectedNullPointer: typeof UnexpectedNullPointer;
  UnexpectedOptionTag: typeof UnexpectedOptionTag;
  UnexpectedRustCallError: typeof UnexpectedRustCallError;
  UnexpectedRustCallStatusCode: typeof UnexpectedRustCallStatusCode;
  UnsupportedConverterError: typeof UnsupportedConverterError;
}>;