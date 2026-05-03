import type { RustBufferStruct, RustCallStatusStruct } from "./ffi-types.js";

export declare const CALL_SUCCESS: 0;
export declare const CALL_ERROR: 1;
export declare const CALL_UNEXPECTED_ERROR: 2;
export declare const CALL_CANCELLED: 3;

export type RustStringLifter = (bytes: Uint8Array) => string;
export type RustErrorHandler<E extends Error = Error> = (
  bytes: Uint8Array,
  status: RustCallStatusStruct,
) => E;
export type RustCallStatusReader<Status = RustCallStatusStruct> = (
  status: Status,
) => RustCallStatusStruct | null | undefined;
export type RustCallStatusWriter<Status = RustCallStatusStruct> = (
  status: Status,
  value: RustCallStatusStruct,
) => Status;

export interface RustCallOptions<E extends Error = Error> {
  errorHandler?: RustErrorHandler<E>;
  freeRustBuffer?: ((buffer: RustBufferStruct) => void) | null;
  liftString?: RustStringLifter;
}

export declare function createRustCallStatus(
  code?: number,
  error_buf?: RustBufferStruct | null,
): RustCallStatusStruct;
export declare function createRustErrorStatus(
  code?: number,
  error_buf?: RustBufferStruct | null,
): RustCallStatusStruct;
export declare function checkRustCallStatus<E extends Error = Error>(
  status: RustCallStatusStruct | null | undefined,
  options?: RustCallOptions<E>,
): RustCallStatusStruct;
export declare function rustCall<T, E extends Error = Error>(
  caller: (status: RustCallStatusStruct) => T,
  options?: RustCallOptions<E>,
): T;
export declare function rustCallWithError<T, E extends Error = Error>(
  errorHandler: RustErrorHandler<E>,
  caller: (status: RustCallStatusStruct) => T,
  options?: Omit<RustCallOptions<E>, "errorHandler">,
): T;

export declare class UniffiRustCaller<
  Status = RustCallStatusStruct,
> {
  constructor(options?: {
    createStatus?: () => Status;
    disposeStatus?: ((status: Status) => void) | null;
    freeRustBuffer?: ((buffer: RustBufferStruct) => void) | null;
    liftString?: RustStringLifter;
    readStatus?: RustCallStatusReader<Status>;
    writeStatus?: RustCallStatusWriter<Status>;
  });
  createCallStatus(): Status;
  createErrorStatus(code?: number, error_buf?: RustBufferStruct | null): Status;
  makeRustCall<T, E extends Error = Error>(
    caller: (status: Status) => T,
    options?: RustCallOptions<E>,
  ): T;
  rustCall<T, E extends Error = Error>(
    caller: (status: Status) => T,
    options?: RustCallOptions<E>,
  ): T;
  rustCallWithError<T, E extends Error = Error>(
    errorHandler: RustErrorHandler<E>,
    caller: (status: Status) => T,
    options?: Omit<RustCallOptions<E>, "errorHandler">,
  ): T;
}

export declare const defaultRustCaller: UniffiRustCaller;