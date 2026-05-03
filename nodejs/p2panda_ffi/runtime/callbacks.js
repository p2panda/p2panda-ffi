import { UniffiRuntimeError, getErrorMessage } from "./errors.js";
import { UniffiHandleMap } from "./handle-map.js";
import { EMPTY_RUST_BUFFER } from "./ffi-types.js";
import {
  CALL_ERROR,
  CALL_SUCCESS,
  CALL_UNEXPECTED_ERROR,
  createRustCallStatus,
} from "./rust-call.js";

const PENDING_FOREIGN_FUTURES = new UniffiHandleMap();

function requireCallbackImplementation(value, interfaceName = "callback interface") {
  if ((typeof value !== "object" && typeof value !== "function") || value == null) {
    throw new TypeError(`${interfaceName} implementations must be objects with callable methods.`);
  }
  return value;
}

function requireCallbackMethod(implementation, methodName, interfaceName = "callback interface") {
  const method = implementation?.[methodName];
  if (typeof method !== "function") {
    throw new TypeError(
      `${interfaceName} is missing required method ${String(methodName)}().`,
    );
  }
  return method;
}

function normalizeCallbackError(error, fallbackMessage = "Unknown error") {
  if (error instanceof Error) {
    return error;
  }
  return new UniffiRuntimeError(getErrorMessage(error, fallbackMessage), {
    cause: error,
    captureStack: false,
  });
}

function lowerCallbackFailure(error, options = {}) {
  const {
    lowerError,
    lowerString,
    defaultMessage = "Callback invocation failed.",
  } = options;
  const message = getErrorMessage(error, defaultMessage);
  let normalizedError = undefined;

  function getNormalizedError() {
    if (normalizedError === undefined) {
      normalizedError = normalizeCallbackError(error, defaultMessage);
    }
    return normalizedError;
  }

  if (typeof lowerError === "function") {
    const loweredError = lowerError(getNormalizedError());
    if (loweredError != null) {
      return {
        code: CALL_ERROR,
        error: getNormalizedError(),
        error_buf: loweredError,
      };
    }
  }

  if (typeof lowerString === "function") {
    return {
      code: CALL_UNEXPECTED_ERROR,
      error: getNormalizedError(),
      error_buf: lowerString(message),
    };
  }

  return {
    code: CALL_UNEXPECTED_ERROR,
    error: getNormalizedError(),
    error_buf: EMPTY_RUST_BUFFER,
  };
}

export function resetCallbackCallStatus(status = undefined) {
  const callbackStatus = status ?? createRustCallStatus();
  callbackStatus.code = CALL_SUCCESS;
  callbackStatus.error_buf = EMPTY_RUST_BUFFER;
  return callbackStatus;
}

export function writeCallbackError(status, error, options = {}) {
  const callbackStatus = status ?? createRustCallStatus();
  const lowered = lowerCallbackFailure(error, options);
  callbackStatus.code = lowered.code;
  callbackStatus.error_buf = lowered.error_buf ?? EMPTY_RUST_BUFFER;
  return lowered.error;
}

export function createPendingForeignFuture({
  callbackData = undefined,
  complete = undefined,
} = {}) {
  const pending = {
    callbackData,
    cancelled: false,
    complete,
    handle: 0n,
    settled: false,
  };
  pending.handle = PENDING_FOREIGN_FUTURES.insert(pending);
  return pending;
}

export function takePendingForeignFuture(handle) {
  const pending = PENDING_FOREIGN_FUTURES.remove(handle);
  if (pending == null) {
    return undefined;
  }
  pending.settled = true;
  return pending;
}

export function freePendingForeignFuture(handle) {
  const pending = takePendingForeignFuture(handle);
  if (pending == null) {
    return undefined;
  }
  pending.cancelled = true;
  return pending;
}

export function clearPendingForeignFutures() {
  for (const pending of PENDING_FOREIGN_FUTURES.values()) {
    pending.cancelled = true;
  }
  PENDING_FOREIGN_FUTURES.clear();
}

export function foreignFutureHandleCount() {
  return PENDING_FOREIGN_FUTURES.size;
}

function createAsyncCallbackCompletion(callStatus, returnValue, hasReturnValue) {
  const completion = {
    call_status: callStatus,
  };
  if (hasReturnValue) {
    completion.return_value = returnValue;
  }
  return completion;
}

function takeCompletablePendingForeignFuture(handle) {
  const pending = takePendingForeignFuture(handle);
  if (pending == null || pending.cancelled || typeof pending.complete !== "function") {
    return undefined;
  }
  return pending;
}

function createAsyncCallbackFailureCompletion(error, options = {}) {
  const {
    defaultReturnValue = undefined,
    hasReturnValue = false,
    interfaceName = "callback interface",
    lowerError,
    lowerString,
    methodName = "callback",
  } = options;
  const callStatus = createRustCallStatus();
  writeCallbackError(callStatus, error, {
    lowerError,
    lowerString,
    defaultMessage: `${interfaceName}.${String(methodName)}() failed.`,
  });
  return createAsyncCallbackCompletion(callStatus, defaultReturnValue, hasReturnValue);
}

function completeAsyncCallbackFailure(handle, error, options = {}) {
  const pending = takeCompletablePendingForeignFuture(handle);
  if (pending == null) {
    return;
  }

  pending.complete(
    pending.callbackData,
    createAsyncCallbackFailureCompletion(error, options),
  );
}

function completeAsyncCallbackSuccess(handle, result, options = {}) {
  const pending = takeCompletablePendingForeignFuture(handle);
  if (pending == null) {
    return;
  }

  const {
    defaultReturnValue = undefined,
    hasReturnValue = false,
    interfaceName = "callback interface",
    lowerError,
    lowerReturn = undefined,
    lowerString,
    methodName = "callback",
  } = options;

  try {
    const callStatus = resetCallbackCallStatus(createRustCallStatus());
    const returnValue =
      typeof lowerReturn === "function"
        ? lowerReturn(result)
        : result;
    pending.complete(
      pending.callbackData,
      createAsyncCallbackCompletion(callStatus, returnValue, hasReturnValue),
    );
  } catch (error) {
    pending.complete(
      pending.callbackData,
      createAsyncCallbackFailureCompletion(error, {
        defaultReturnValue,
        hasReturnValue,
        interfaceName,
        lowerError,
        lowerString,
        methodName,
      }),
    );
  }
}

export function invokeCallbackMethod({
  registry,
  handle,
  methodName,
  args = [],
  defaultReturnValue = undefined,
  interfaceName = registry?.interfaceName ?? "callback interface",
  lowerError,
  lowerString,
  status = undefined,
}) {
  try {
    const implementation = registry.get(handle);
    const method = requireCallbackMethod(implementation, methodName, interfaceName);
    const result = method.apply(implementation, Array.from(args));
    if (status != null) {
      resetCallbackCallStatus(status);
    }
    return result;
  } catch (error) {
    if (status == null) {
      throw error;
    }
    writeCallbackError(status, error, {
      lowerError,
      lowerString,
      defaultMessage: `${interfaceName}.${String(methodName)}() failed.`,
    });
    return defaultReturnValue;
  }
}

export function invokeAsyncCallbackMethod({
  registry,
  handle,
  methodName,
  args = [],
  callbackData = undefined,
  complete = undefined,
  defaultReturnValue = undefined,
  interfaceName = registry?.interfaceName ?? "callback interface",
  lowerError,
  lowerReturn = undefined,
  lowerString,
}) {
  const pending = createPendingForeignFuture({
    callbackData,
    complete,
  });
  const hasReturnValue =
    typeof lowerReturn === "function"
    || defaultReturnValue !== undefined;

  let promise;
  try {
    const implementation = registry.get(handle);
    const method = requireCallbackMethod(implementation, methodName, interfaceName);
    promise = Promise.resolve(method.apply(implementation, Array.from(args)));
  } catch (error) {
    promise = Promise.reject(error);
  }

  void promise.then(
    (result) => {
      completeAsyncCallbackSuccess(pending.handle, result, {
        defaultReturnValue,
        hasReturnValue,
        interfaceName,
        lowerError,
        lowerReturn,
        lowerString,
        methodName,
      });
    },
    (error) => {
      completeAsyncCallbackFailure(pending.handle, error, {
        defaultReturnValue,
        hasReturnValue,
        interfaceName,
        lowerError,
        lowerString,
        methodName,
      });
    },
  );

  return pending.handle;
}

export class UniffiCallbackRegistry {
  constructor({
    interfaceName = "callback interface",
    firstHandle = undefined,
    handleStep = undefined,
    validate = undefined,
  } = {}) {
    this.interfaceName = interfaceName;
    this._handleMap = new UniffiHandleMap({
      firstHandle,
      handleStep,
    });
    this._validate = validate;
  }

  _normalizeImplementation(value) {
    const implementation = requireCallbackImplementation(value, this.interfaceName);
    if (typeof this._validate === "function") {
      this._validate(implementation);
    }
    return implementation;
  }

  register(value) {
    return this._handleMap.insert(this._normalizeImplementation(value));
  }

  cloneHandle(handle) {
    return this._handleMap.clone(handle);
  }

  get(handle) {
    return this._handleMap.get(handle);
  }

  remove(handle) {
    return this._handleMap.remove(handle);
  }

  take(handle) {
    return this._handleMap.take(handle);
  }

  has(handle) {
    return this._handleMap.has(handle);
  }

  clear() {
    this._handleMap.clear();
  }

  invoke(handle, methodName, args = []) {
    const implementation = this.get(handle);
    const method = requireCallbackMethod(implementation, methodName, this.interfaceName);
    return method.apply(implementation, Array.from(args));
  }

  invokeWithRustCallStatus(handle, methodName, options = {}) {
    return invokeCallbackMethod({
      registry: this,
      handle,
      methodName,
      ...options,
    });
  }

  get size() {
    return this._handleMap.size;
  }
}

export function createCallbackRegistry(options = undefined) {
  return new UniffiCallbackRegistry(options);
}