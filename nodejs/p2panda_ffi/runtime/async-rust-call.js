import { AbortError, ConverterRangeError } from "./errors.js";
import { UniffiHandleMap } from "./handle-map.js";
import { defaultRustCaller } from "./rust-call.js";

export const RUST_FUTURE_POLL_READY = 0;
export const RUST_FUTURE_POLL_WAKE = 1;
const RUST_FUTURE_KEEPALIVE_DELAY_MS = 0x7fffffff;

const MIN_I8 = -0x80;
const MAX_I8 = 0x7f;
const MAX_U8 = 0xff;
const RUST_FUTURE_RESOLVER_MAP = new UniffiHandleMap();
const RUST_FUTURE_KEEPALIVE_MAP = new Map();

function identity(value) {
  return value;
}

export function decodeRustFuturePoll(value) {
  const numericValue =
    typeof value === "bigint"
      ? Number(value)
      : value;
  if (!Number.isInteger(numericValue) || numericValue < MIN_I8 || numericValue > MAX_U8) {
    throw new ConverterRangeError(
      `RustFuturePoll must be an integer between ${MIN_I8} and ${MAX_U8}.`,
    );
  }
  return numericValue > MAX_I8
    ? numericValue - 0x100
    : numericValue;
}

export function createAsyncCallState() {
  return {
    resolverHandle: null,
  };
}

function clearRustFutureKeepAlive(handle) {
  const keepAlive = RUST_FUTURE_KEEPALIVE_MAP.get(handle);
  if (keepAlive === undefined) {
    return;
  }

  RUST_FUTURE_KEEPALIVE_MAP.delete(handle);
  clearTimeout(keepAlive);
}

export function cleanupAsyncCallState(state) {
  if (!state || state.resolverHandle == null) {
    return;
  }

  clearRustFutureKeepAlive(state.resolverHandle);
  RUST_FUTURE_RESOLVER_MAP.remove(state.resolverHandle);
  state.resolverHandle = null;
}

export const rustFutureContinuationCallback = (handle, pollResult) => {
  clearRustFutureKeepAlive(handle);
  const resolve = RUST_FUTURE_RESOLVER_MAP.remove(handle);
  if (resolve === undefined) {
    return false;
  }

  queueMicrotask(() => {
    resolve(decodeRustFuturePoll(pollResult));
  });
  return true;
};

export function pollRustFuture(
  rustFuture,
  pollFunc,
  {
    continuationCallback = rustFutureContinuationCallback,
    state = createAsyncCallState(),
  } = {},
) {
  cleanupAsyncCallState(state);

  return new Promise((resolve, reject) => {
    // Node 22 can tear down the event loop while this promise is still waiting
    // on a native callback. Keep a ref'ed timer alive until the callback
    // settles so Rust future completions arrive before environment cleanup.
    const keepAlive = setTimeout(() => {}, RUST_FUTURE_KEEPALIVE_DELAY_MS);
    let resolverHandle = null;
    const settle = (callback, value) => {
      clearRustFutureKeepAlive(resolverHandle);
      callback(value);
    };
    resolverHandle = RUST_FUTURE_RESOLVER_MAP.insert((pollCode) => {
      state.resolverHandle = null;
      settle(resolve, pollCode);
    });
    RUST_FUTURE_KEEPALIVE_MAP.set(resolverHandle, keepAlive);
    state.resolverHandle = resolverHandle;

    try {
      pollFunc(rustFuture, continuationCallback, resolverHandle);
    } catch (error) {
      cleanupAsyncCallState(state);
      settle(reject, error);
    }
  });
}

export function completeRustFuture(
  rustFuture,
  completeFunc,
  {
    errorHandler,
    freeRustBuffer,
    liftString,
    rustCaller = defaultRustCaller,
  } = {},
) {
  return rustCaller.makeRustCall(
    (status) => completeFunc(rustFuture, status),
    {
      errorHandler,
      freeRustBuffer,
      liftString,
    },
  );
}

export function cancelRustFuture(rustFuture, cancelFunc = undefined) {
  if (typeof cancelFunc === "function") {
    cancelFunc(rustFuture);
  }
}

export function freeRustFuture(rustFuture, freeFunc = undefined) {
  if (typeof freeFunc === "function") {
    freeFunc(rustFuture);
  }
}

export async function rustCallAsync({
  cancelFunc,
  completeFunc,
  continuationCallback = rustFutureContinuationCallback,
  errorHandler,
  freeFunc,
  freeRustBuffer,
  liftFunc = identity,
  liftString,
  pollFunc,
  rustCaller = defaultRustCaller,
  rustFutureFunc,
  signal = undefined,
}) {
  if (signal?.aborted) {
    throw new AbortError();
  }

  const rustFuture = rustFutureFunc();
  const state = createAsyncCallState();
  const abortListener =
    signal == null
      ? null
      : () => {
          try {
            cancelRustFuture(rustFuture, cancelFunc);
          } catch {
            // Preserve the original async failure path.
          }
        };

  if (signal && abortListener) {
    if (signal.aborted) {
      abortListener();
    } else {
      signal.addEventListener("abort", abortListener, { once: true });
    }
  }

  try {
    while (true) {
      const pollCode = await pollRustFuture(rustFuture, pollFunc, {
        continuationCallback,
        state,
      });
      if (pollCode === RUST_FUTURE_POLL_READY) {
        break;
      }
      if (pollCode !== RUST_FUTURE_POLL_WAKE) {
        throw new ConverterRangeError(
          `Unexpected RustFuturePoll value ${String(pollCode)}.`,
        );
      }
    }

    const completed = completeRustFuture(rustFuture, completeFunc, {
      errorHandler,
      freeRustBuffer,
      liftString,
      rustCaller,
    });
    return liftFunc(completed);
  } finally {
    if (signal && abortListener) {
      signal.removeEventListener("abort", abortListener);
    }
    try {
      freeRustFuture(rustFuture, freeFunc);
    } finally {
      cleanupAsyncCallState(state);
    }
  }
}

export function rustFutureHandleCount() {
  return RUST_FUTURE_RESOLVER_MAP.size;
}