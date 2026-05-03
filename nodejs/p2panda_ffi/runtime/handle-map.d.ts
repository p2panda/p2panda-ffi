export type UniffiHandle = bigint;

export declare const INVALID_HANDLE: 0n;
export declare const defaultUniffiHandle: 0n;
export declare const FIRST_FOREIGN_HANDLE: 1n;
export declare const FOREIGN_HANDLE_STEP: 2n;

export interface HandleMapOptions {
  firstHandle?: bigint | number;
  handleStep?: bigint | number;
}

export declare class UniffiHandleMap<T>
  implements Iterable<[UniffiHandle, T]>
{
  constructor(options?: HandleMapOptions);
  insert(value: T): UniffiHandle;
  register(handle: bigint | number, value: T): UniffiHandle;
  get(handle: bigint | number): T;
  peek(handle: bigint | number | null | undefined): T | undefined;
  clone(handle: bigint | number): UniffiHandle;
  remove(handle: bigint | number | null | undefined): T | undefined;
  take(handle: bigint | number): T;
  has(handle: bigint | number | null | undefined): boolean;
  clear(): void;
  keys(): IterableIterator<UniffiHandle>;
  values(): IterableIterator<T>;
  entries(): IterableIterator<[UniffiHandle, T]>;
  [Symbol.iterator](): IterableIterator<[UniffiHandle, T]>;
  readonly size: number;
}

export declare function createHandleMap<T>(
  options?: HandleMapOptions,
): UniffiHandleMap<T>;