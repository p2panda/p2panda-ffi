import type { RustCallStatusStruct } from "./ffi-types.js";
import type { RustCallOptions, UniffiRustCaller } from "./rust-call.js";

export declare const RUST_FUTURE_POLL_READY: 0;
export declare const RUST_FUTURE_POLL_WAKE: 1;

export interface AsyncCallState {
  resolverHandle: bigint | null;
}

export type RustFutureContinuationCallback = (
  handle: bigint | number,
  pollResult: bigint | number,
) => boolean;

export interface PollRustFutureOptions {
  continuationCallback?: RustFutureContinuationCallback;
  state?: AsyncCallState;
}

export interface CompleteRustFutureOptions<
  Status = RustCallStatusStruct,
  E extends Error = Error,
> extends RustCallOptions<E> {
  rustCaller?: UniffiRustCaller<Status>;
}

export interface RustCallAsyncOptions<
  Lowered,
  Result = Lowered,
  Status = RustCallStatusStruct,
  E extends Error = Error,
> extends CompleteRustFutureOptions<Status, E> {
  cancelFunc?: ((rustFuture: bigint) => void) | null;
  completeFunc: (rustFuture: bigint, status: Status) => Lowered;
  continuationCallback?: RustFutureContinuationCallback;
  freeFunc?: ((rustFuture: bigint) => void) | null;
  liftFunc?: (value: Lowered) => Result;
  pollFunc: (
    rustFuture: bigint,
    continuationCallback: RustFutureContinuationCallback,
    continuationHandle: bigint,
  ) => void;
  rustFutureFunc: () => bigint;
  signal?: AbortSignal | null;
}

export declare function decodeRustFuturePoll(value: bigint | number): number;
export declare function createAsyncCallState(): AsyncCallState;
export declare function cleanupAsyncCallState(state: AsyncCallState): void;
export declare const rustFutureContinuationCallback: RustFutureContinuationCallback;
export declare function pollRustFuture(
  rustFuture: bigint,
  pollFunc: (
    rustFuture: bigint,
    continuationCallback: RustFutureContinuationCallback,
    continuationHandle: bigint,
  ) => void,
  options?: PollRustFutureOptions,
): Promise<number>;
export declare function completeRustFuture<
  Lowered,
  Status = RustCallStatusStruct,
  E extends Error = Error,
>(
  rustFuture: bigint,
  completeFunc: (rustFuture: bigint, status: Status) => Lowered,
  options?: CompleteRustFutureOptions<Status, E>,
): Lowered;
export declare function cancelRustFuture(
  rustFuture: bigint,
  cancelFunc?: ((rustFuture: bigint) => void) | null,
): void;
export declare function freeRustFuture(
  rustFuture: bigint,
  freeFunc?: ((rustFuture: bigint) => void) | null,
): void;
export declare function rustCallAsync<
  Lowered,
  Result = Lowered,
  Status = RustCallStatusStruct,
  E extends Error = Error,
>(
  options: RustCallAsyncOptions<Lowered, Result, Status, E>,
): Promise<Result>;
export declare function rustFutureHandleCount(): number;