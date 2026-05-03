function assignErrorMetadata(error, options = {}) {
  if (options.cause !== undefined) {
    error.cause = options.cause;
  }
  if (options.code !== undefined) {
    error.code = options.code;
  }
  if (options.details !== undefined) {
    error.details = options.details;
  }
  return error;
}

function stagedBinaryGuidance(details = {}) {
  const packageRelativePath =
    details != null && typeof details === "object"
      ? details.packageRelativePath
      : undefined;
  if (packageRelativePath == null) {
    return "Copy the intended native library into the generated package or call load(path).";
  }
  return `Copy the intended native library into the generated package at ${JSON.stringify(packageRelativePath)} or call load(path).`;
}

export class UniffiError extends Error {
  constructor(message = "UniFFI error", options = {}) {
    const captureStack = options.captureStack !== false;
    if (!captureStack && typeof Error.stackTraceLimit === "number") {
      const previousStackTraceLimit = Error.stackTraceLimit;
      Error.stackTraceLimit = 0;
      try {
        super(message);
      } finally {
        Error.stackTraceLimit = previousStackTraceLimit;
      }
    } else {
      super(message);
    }
    this.name = new.target.name;
    assignErrorMetadata(this, options);
  }
}

export class UniffiGeneratedError extends UniffiError {}

export class UniffiRuntimeError extends UniffiError {}

export class RustPanic extends UniffiRuntimeError {
  constructor(message = "Rust panic", options = {}) {
    super(message, options);
  }
}

export class AbortError extends UniffiRuntimeError {
  constructor(message = "The Rust call was cancelled.", options = {}) {
    super(message, options);
  }
}

export class LibraryNotLoadedError extends UniffiRuntimeError {
  constructor(message = "The native library is not loaded.", options = {}) {
    super(message, options);
  }
}

export class ContractVersionMismatchError extends UniffiRuntimeError {
  constructor(expected, actual, options = {}) {
    const details =
      options.details != null && typeof options.details === "object"
        ? options.details
        : {};
    const libraryPath = details.libraryPath;
    const symbolName = details.symbolName;
    super(
      `UniFFI contract version mismatch${
        symbolName == null ? "" : ` for ${String(symbolName)}`
      }${
        libraryPath == null ? "" : ` in ${JSON.stringify(libraryPath)}`
      }: generated package expects ${String(expected)}, loaded library reported ${String(actual)}. ${stagedBinaryGuidance(details)}`,
      {
        ...options,
        details: {
          ...details,
          expected,
          actual,
        },
      },
    );
  }
}

export class ChecksumMismatchError extends UniffiRuntimeError {
  constructor(kind, expected, actual, options = {}) {
    const libraryPath =
      options.details != null && typeof options.details === "object"
        ? options.details.libraryPath
        : undefined;
    super(
      `UniFFI checksum mismatch for ${String(kind)}${
        libraryPath == null ? "" : ` in ${JSON.stringify(libraryPath)}`
      }: generated package expects ${String(expected)}, loaded library reported ${String(actual)}. ${stagedBinaryGuidance(
        options.details,
      )}`,
      {
        ...options,
        details: {
          ...(options.details != null && typeof options.details === "object"
            ? options.details
            : {}),
          kind,
          expected,
          actual,
        },
      },
    );
  }
}

export class UnexpectedRustCallError extends UniffiRuntimeError {
  constructor(message = "Rust returned an expected error without a decoder.", options = {}) {
    super(message, options);
  }
}

export class UnexpectedRustCallStatusCode extends UniffiRuntimeError {
  constructor(code, options = {}) {
    super(`Unexpected RustCallStatus code: ${String(code)}.`, {
      ...options,
      code,
    });
  }
}

export class UnexpectedEnumCase extends UniffiRuntimeError {
  constructor(message = "Encountered an unknown enum case.", options = {}) {
    super(message, options);
  }
}

export class UnexpectedNullPointer extends UniffiRuntimeError {
  constructor(message = "Received a null pointer where a value was required.", options = {}) {
    super(message, options);
  }
}

export class UnexpectedOptionTag extends UniffiRuntimeError {
  constructor(tag, options = {}) {
    super(`Unexpected option tag byte: ${String(tag)}.`, {
      ...options,
      code: tag,
    });
  }
}

export class ConverterRangeError extends UniffiRuntimeError {
  constructor(message = "Value cannot be represented by the requested UniFFI type.", options = {}) {
    super(message, options);
  }
}

export class BufferOverflowError extends UniffiRuntimeError {
  constructor(message = "Buffer does not contain enough bytes.", options = {}) {
    super(message, options);
  }
}

export class BufferSizeMismatchError extends UniffiRuntimeError {
  constructor(expected, actual, options = {}) {
    super(
      `Serialized buffer size mismatch: expected ${String(expected)} bytes, wrote ${String(actual)}.`,
      {
        ...options,
        details: { expected, actual },
      },
    );
  }
}

export class TrailingBytesError extends UniffiRuntimeError {
  constructor(remaining, options = {}) {
    super(`Serialized buffer has ${String(remaining)} unread trailing byte(s).`, {
      ...options,
      details: { remaining },
    });
  }
}

export class DuplicateHandleError extends UniffiRuntimeError {
  constructor(handle, options = {}) {
    super(`Handle ${String(handle)} is already registered.`, {
      ...options,
      details: { handle },
    });
  }
}

export class StaleHandleError extends UniffiRuntimeError {
  constructor(handle, options = {}) {
    super(`Handle ${String(handle)} is stale or unknown.`, {
      ...options,
      details: { handle },
    });
  }
}

export class UnsupportedConverterError extends UniffiRuntimeError {
  constructor(message = "The requested UniFFI converter is not available.", options = {}) {
    super(message, options);
  }
}

export function attachCause(error, cause) {
  if (cause !== undefined) {
    error.cause = cause;
  }
  return error;
}

export function getErrorMessage(value, fallbackMessage = "Unknown error") {
  if (value instanceof Error) {
    return value.message || fallbackMessage;
  }
  if (typeof value === "string") {
    return value;
  }
  if (value == null) {
    return fallbackMessage;
  }
  if (typeof value === "object" && typeof value.message === "string") {
    return value.message;
  }
  return String(value);
}

export function ensureError(value, fallbackMessage = "Unknown error") {
  if (value instanceof Error) {
    return value;
  }
  return new UniffiRuntimeError(getErrorMessage(value, fallbackMessage), {
    cause: value,
  });
}

export function createUniffiErrorClass(
  name,
  { baseClass = UniffiGeneratedError, defaultMessage = name } = {},
) {
  return class extends baseClass {
    constructor(message = defaultMessage, options = {}) {
      super(message, options);
      this.name = name;
    }
  };
}

export const UniffiInternalError = Object.freeze({
  AbortError,
  BufferOverflowError,
  BufferSizeMismatchError,
  ChecksumMismatchError,
  ContractVersionMismatchError,
  ConverterRangeError,
  DuplicateHandleError,
  LibraryNotLoadedError,
  RustPanic,
  StaleHandleError,
  TrailingBytesError,
  UnexpectedEnumCase,
  UnexpectedNullPointer,
  UnexpectedOptionTag,
  UnexpectedRustCallError,
  UnexpectedRustCallStatusCode,
  UnsupportedConverterError,
});