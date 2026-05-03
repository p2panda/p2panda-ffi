import type { HandleMapOptions } from "./handle-map.js";
import type { RustBufferStruct, RustCallStatusStruct } from "./ffi-types.js";

export interface CallbackRegistryOptions<T extends object = Record<string, unknown>>
  extends HandleMapOptions
{
  interfaceName?: string;
  validate?: ((value: T) => void) | null;
}

export interface CallbackErrorOptions<E extends Error = Error> {
  lowerError?: ((error: E) => RustBufferStruct | null | undefined) | null;
  lowerString?: ((message: string) => RustBufferStruct) | null;
  defaultMessage?: string;
}

export interface PendingForeignFuture<Result = unknown> {
  callbackData: bigint | number | undefined;
  cancelled: boolean;
  complete: ((
    callbackData: bigint | number | undefined,
    result: Result,
  ) => void) | undefined;
  handle: bigint;
  settled: boolean;
}

export interface PendingForeignFutureOptions<Result = unknown> {
  callbackData?: bigint | number;
  complete?: ((
    callbackData: bigint | number | undefined,
    result: Result,
  ) => void) | null;
}

export interface AsyncCallbackCompletion<Lowered = unknown> {
  call_status: RustCallStatusStruct;
  return_value?: Lowered;
}

export interface InvokeCallbackMethodOptions<T = unknown, E extends Error = Error>
  extends CallbackErrorOptions<E>
{
  args?: readonly unknown[];
  defaultReturnValue?: T;
  interfaceName?: string;
  status?: RustCallStatusStruct | null;
}

export interface InvokeAsyncCallbackMethodOptions<
  Result = unknown,
  Lowered = Result,
  E extends Error = Error,
> extends CallbackErrorOptions<E>
{
  args?: readonly unknown[];
  callbackData?: bigint | number;
  complete?: ((
    callbackData: bigint | number | undefined,
    result: AsyncCallbackCompletion<Lowered>,
  ) => void) | null;
  defaultReturnValue?: Lowered;
  interfaceName?: string;
  lowerReturn?: ((value: Result) => Lowered) | null;
}

export declare function resetCallbackCallStatus(
  status?: RustCallStatusStruct | null,
): RustCallStatusStruct;
export declare function writeCallbackError<E extends Error = Error>(
  status: RustCallStatusStruct | null | undefined,
  error: unknown,
  options?: CallbackErrorOptions<E>,
): E;
export declare function createPendingForeignFuture<Result = unknown>(
  options?: PendingForeignFutureOptions<Result>,
): PendingForeignFuture<Result>;
export declare function takePendingForeignFuture<Result = unknown>(
  handle: bigint | number,
): PendingForeignFuture<Result> | undefined;
export declare function freePendingForeignFuture<Result = unknown>(
  handle: bigint | number,
): PendingForeignFuture<Result> | undefined;
export declare function clearPendingForeignFutures(): void;
export declare function foreignFutureHandleCount(): number;
export declare function invokeCallbackMethod<T = unknown, E extends Error = Error>(params: {
  registry: Pick<UniffiCallbackRegistry, "get"> & { interfaceName?: string };
  handle: bigint | number;
  methodName: string;
} & InvokeCallbackMethodOptions<T, E>): T;
export declare function invokeAsyncCallbackMethod<
  Result = unknown,
  Lowered = Result,
  E extends Error = Error,
>(params: {
  registry: Pick<UniffiCallbackRegistry, "get"> & { interfaceName?: string };
  handle: bigint | number;
  methodName: string;
} & InvokeAsyncCallbackMethodOptions<Result, Lowered, E>): bigint;

export declare class UniffiCallbackRegistry<T extends object = Record<string, unknown>> {
  readonly interfaceName: string;
  constructor(options?: CallbackRegistryOptions<T>);
  register(value: T): bigint;
  cloneHandle(handle: bigint | number): bigint;
  get(handle: bigint | number): T;
  remove(handle: bigint | number | null | undefined): T | undefined;
  take(handle: bigint | number): T;
  has(handle: bigint | number | null | undefined): boolean;
  clear(): void;
  invoke<R>(handle: bigint | number, methodName: string, args?: readonly unknown[]): R;
  invokeWithRustCallStatus<R, E extends Error = Error>(
    handle: bigint | number,
    methodName: string,
    options?: InvokeCallbackMethodOptions<R, E>,
  ): R;
  readonly size: number;
}

export declare function createCallbackRegistry<T extends object = Record<string, unknown>>(
  options?: CallbackRegistryOptions<T>,
): UniffiCallbackRegistry<T>;