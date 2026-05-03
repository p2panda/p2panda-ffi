import { DuplicateHandleError, StaleHandleError } from "./errors.js";
import { normalizeHandle, normalizeUInt64 } from "./ffi-types.js";

export const INVALID_HANDLE = 0n;
export const defaultUniffiHandle = INVALID_HANDLE;
export const FIRST_FOREIGN_HANDLE = 1n;
export const FOREIGN_HANDLE_STEP = 2n;

function requireHandle(handle, label = "handle") {
  const normalized = normalizeHandle(handle);
  if (normalized == null || normalized === INVALID_HANDLE) {
    throw new TypeError(`${label} must be a non-zero UniFFI handle.`);
  }
  return normalized;
}

function normalizeHandleStep(step) {
  const normalized = normalizeUInt64(step ?? FOREIGN_HANDLE_STEP);
  if (normalized == null || normalized === 0n) {
    throw new TypeError("handleStep must be a positive integer.");
  }
  return normalized;
}

export class UniffiHandleMap {
  constructor({
    firstHandle = FIRST_FOREIGN_HANDLE,
    handleStep = FOREIGN_HANDLE_STEP,
  } = {}) {
    this._map = new Map();
    this._nextHandle = requireHandle(firstHandle, "firstHandle");
    this._handleStep = normalizeHandleStep(handleStep);
  }

  _allocateHandle() {
    const handle = this._nextHandle;
    this._nextHandle += this._handleStep;
    return handle;
  }

  insert(value) {
    let handle = this._allocateHandle();
    while (this._map.has(handle)) {
      handle = this._allocateHandle();
    }
    this._map.set(handle, value);
    return handle;
  }

  register(handle, value) {
    const normalized = requireHandle(handle);
    if (this._map.has(normalized)) {
      throw new DuplicateHandleError(normalized);
    }
    this._map.set(normalized, value);
    return normalized;
  }

  get(handle) {
    const normalized = requireHandle(handle);
    if (!this._map.has(normalized)) {
      throw new StaleHandleError(normalized);
    }
    return this._map.get(normalized);
  }

  peek(handle) {
    const normalized = normalizeHandle(handle);
    if (normalized == null || normalized === INVALID_HANDLE) {
      return undefined;
    }
    return this._map.get(normalized);
  }

  clone(handle) {
    return this.insert(this.get(handle));
  }

  remove(handle) {
    const normalized = normalizeHandle(handle);
    if (normalized == null || normalized === INVALID_HANDLE) {
      return undefined;
    }

    const value = this._map.get(normalized);
    if (this._map.has(normalized)) {
      this._map.delete(normalized);
      return value;
    }
    return undefined;
  }

  take(handle) {
    const normalized = requireHandle(handle);
    if (!this._map.has(normalized)) {
      throw new StaleHandleError(normalized);
    }
    const value = this._map.get(normalized);
    this._map.delete(normalized);
    return value;
  }

  has(handle) {
    const normalized = normalizeHandle(handle);
    return normalized != null
      && normalized !== INVALID_HANDLE
      && this._map.has(normalized);
  }

  clear() {
    this._map.clear();
  }

  keys() {
    return this._map.keys();
  }

  values() {
    return this._map.values();
  }

  entries() {
    return this._map.entries();
  }

  [Symbol.iterator]() {
    return this.entries();
  }

  get size() {
    return this._map.size;
  }
}

export function createHandleMap(options = undefined) {
  return new UniffiHandleMap(options);
}