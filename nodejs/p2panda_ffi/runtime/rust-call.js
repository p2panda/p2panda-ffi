import {
  AbortError,
  RustPanic,
  UnexpectedRustCallError,
  UnexpectedRustCallStatusCode,
} from "./errors.js";
import { FfiConverterString } from "./ffi-converters.js";
import {
  EMPTY_RUST_BUFFER,
  EMPTY_RUST_CALL_STATUS,
  RustBufferValue,
  RustCallStatusCodes,
  normalizeRustBuffer,
  normalizeRustCallStatus,
} from "./ffi-types.js";

export const CALL_SUCCESS = RustCallStatusCodes.SUCCESS;
export const CALL_ERROR = RustCallStatusCodes.ERROR;
export const CALL_UNEXPECTED_ERROR = RustCallStatusCodes.UNEXPECTED_ERROR;
export const CALL_CANCELLED = RustCallStatusCodes.CANCELLED;

function defaultLiftString(bytes) {
  return FfiConverterString.lift(bytes);
}

function defaultReadStatus(status) {
  return status;
}

function defaultWriteStatus(status, value) {
  if (status == null || typeof status !== "object") {
    return value;
  }

  status.code = value.code;
  status.error_buf = createMutableRustBuffer(value.error_buf);
  return status;
}

function createMutableRustBuffer(buffer = EMPTY_RUST_BUFFER) {
  return normalizeRustBuffer(buffer) ?? {
    capacity: 0n,
    len: 0n,
    data: null,
  };
}

function isEmptyRustBuffer(buffer) {
  return (
    buffer == null
    || (
      buffer.data == null
      && buffer.len === 0n
      && buffer.capacity === 0n
    )
  );
}

function consumeRustBuffer(buffer, freeRustBuffer) {
  const normalized = createMutableRustBuffer(buffer);
  if (normalized.len === 0n) {
    return new Uint8Array();
  }

  const rustBuffer = new RustBufferValue(normalized);
  if (typeof freeRustBuffer === "function") {
    return rustBuffer.consumeIntoUint8Array(freeRustBuffer);
  }
  return rustBuffer.toUint8Array();
}

export function createRustCallStatus(
  code = CALL_SUCCESS,
  error_buf = EMPTY_RUST_BUFFER,
) {
  return {
    code,
    error_buf: createMutableRustBuffer(error_buf),
  };
}

export function createRustErrorStatus(
  code = CALL_ERROR,
  error_buf = EMPTY_RUST_BUFFER,
) {
  return createRustCallStatus(code, error_buf);
}

function checkRustCallStatusImpl(
  status,
  options,
  freeRustBuffer,
  liftString,
  errorHandlerOverride = undefined,
) {
  if (status?.code === CALL_SUCCESS && isEmptyRustBuffer(status.error_buf)) {
    return status;
  }

  const normalized = normalizeRustCallStatus(status) ?? createRustCallStatus();
  const errorHandler = errorHandlerOverride ?? options?.errorHandler;
  const resolvedFreeRustBuffer = options?.freeRustBuffer ?? freeRustBuffer;
  const resolvedLiftString = options?.liftString ?? liftString;

  switch (normalized.code) {
    case CALL_SUCCESS:
      return normalized;

    case CALL_ERROR: {
      const errorBytes = consumeRustBuffer(normalized.error_buf, resolvedFreeRustBuffer);
      if (typeof errorHandler === "function") {
        throw errorHandler(errorBytes, normalized);
      }
      throw new UnexpectedRustCallError();
    }

    case CALL_UNEXPECTED_ERROR: {
      const errorBytes = consumeRustBuffer(normalized.error_buf, resolvedFreeRustBuffer);
      const message =
        errorBytes.byteLength === 0
          ? "Rust panic"
          : resolvedLiftString(errorBytes);
      throw new RustPanic(message, { captureStack: false });
    }

    case CALL_CANCELLED:
      throw new AbortError();

    default:
      throw new UnexpectedRustCallStatusCode(normalized.code);
  }
}

export function checkRustCallStatus(status, options = undefined) {
  return checkRustCallStatusImpl(
    status,
    options,
    undefined,
    defaultLiftString,
  );
}

export function rustCall(caller, options = undefined) {
  const status = createRustCallStatus();
  const result = caller(status);
  checkRustCallStatusImpl(status, options, undefined, defaultLiftString);
  return result;
}

export function rustCallWithError(errorHandler, caller, options = undefined) {
  const status = createRustCallStatus();
  const result = caller(status);
  checkRustCallStatusImpl(
    status,
    options,
    undefined,
    defaultLiftString,
    errorHandler,
  );
  return result;
}

export class UniffiRustCaller {
  constructor({
    createStatus = () => createRustCallStatus(),
    disposeStatus = undefined,
    freeRustBuffer = undefined,
    liftString = defaultLiftString,
    readStatus = defaultReadStatus,
    writeStatus = defaultWriteStatus,
  } = {}) {
    this._createStatus = createStatus;
    this._disposeStatus = disposeStatus;
    this._freeRustBuffer = freeRustBuffer;
    this._liftString = liftString;
    this._readStatus = readStatus;
    this._writeStatus = writeStatus;
  }

  createCallStatus() {
    return this._writeStatus(this._createStatus(), EMPTY_RUST_CALL_STATUS);
  }

  createErrorStatus(code = CALL_ERROR, error_buf = EMPTY_RUST_BUFFER) {
    return this._writeStatus(
      this._createStatus(),
      createRustCallStatus(code, error_buf),
    );
  }

  makeRustCall(caller, options = undefined) {
    const status = this.createCallStatus();
    try {
      const result = caller(status);
      checkRustCallStatusImpl(
        this._readStatus(status),
        options,
        this._freeRustBuffer,
        this._liftString,
      );
      return result;
    } finally {
      if (typeof this._disposeStatus === "function") {
        this._disposeStatus(status);
      }
    }
  }

  rustCall(caller, options = undefined) {
    return this.makeRustCall(caller, options);
  }

  rustCallWithError(errorHandler, caller, options = undefined) {
    const status = this.createCallStatus();
    try {
      const result = caller(status);
      checkRustCallStatusImpl(
        this._readStatus(status),
        options,
        this._freeRustBuffer,
        this._liftString,
        errorHandler,
      );
      return result;
    } finally {
      if (typeof this._disposeStatus === "function") {
        this._disposeStatus(status);
      }
    }
  }
}

export const defaultRustCaller = new UniffiRustCaller();