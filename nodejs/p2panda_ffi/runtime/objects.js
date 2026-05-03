import koffi from "koffi";
import { UnexpectedNullPointer } from "./errors.js";
import { isNullPointer, normalizeUInt64, pointerAddress } from "./ffi-types.js";

const uniffiFinalizerTokenSymbol = Symbol("uniffi.finalizerToken");
const uniffiObjectGenericAbiSymbol = Symbol("uniffi.objectGenericAbi");
const uniffiObjectRawExternalSymbol = Symbol("uniffi.objectRawExternal");

export const uniffiTypeNameSymbol = Symbol("uniffi.typeName");
export const uniffiObjectFactorySymbol = Symbol("uniffi.objectFactory");
export const uniffiObjectHandleSymbol = Symbol("uniffi.objectHandle");
export const uniffiObjectDestroyedSymbol = Symbol("uniffi.objectDestroyed");
export const UNIFFI_OBJECT_HANDLE_SIZE = 8;

function requireObjectInstance(value, label = "UniFFI object") {
  if (typeof value !== "object" || value == null) {
    throw new TypeError(`${label} instances must be non-null objects.`);
  }
  return value;
}

function requireHandle(handle, label = "UniFFI handle") {
  if (handle == null || isNullPointer(handle)) {
    throw new UnexpectedNullPointer(`${label} is null or has already been destroyed.`);
  }
  return handle;
}

function storedHandle(value) {
  const handle = value?.[uniffiObjectHandleSymbol];
  if (handle == null || isNullPointer(handle)) {
    return undefined;
  }
  return handle;
}

function objectFactory(value) {
  const factory = value?.[uniffiObjectFactorySymbol];
  if (
    factory == null
    || typeof factory.create !== "function"
    || typeof factory.destroy !== "function"
    || typeof factory.handle !== "function"
  ) {
    return undefined;
  }
  return factory;
}

function resolveHandleType(handleType) {
  return typeof handleType === "function"
    ? handleType()
    : handleType;
}

export class UniffiObjectBase {
  get uniffiTypeName() {
    return this[uniffiTypeNameSymbol] ?? this.constructor?.name ?? "UniFFI object";
  }

  get uniffiHandle() {
    const factory = objectFactory(this);
    if (factory == null) {
      throw new TypeError(`${this.uniffiTypeName} is not attached to a UniFFI object factory.`);
    }
    return factory.handle(this);
  }

  uniffiDestroy() {
    const factory = objectFactory(this);
    if (factory == null) {
      return false;
    }
    return factory.destroy(this);
  }

  dispose() {
    return this.uniffiDestroy();
  }
}

export class UniffiObjectFactory {
  constructor({
    typeName = "UniFFI object",
    createInstance = () => Object.create(UniffiObjectBase.prototype),
    cloneFreeUsesUniffiHandle = false,
    cloneHandle = undefined,
    cloneHandleGeneric = undefined,
    cloneHandleRawExternal = undefined,
    freeHandle = undefined,
    freeHandleGeneric = undefined,
    freeHandleRawExternal = undefined,
    handleType = undefined,
    serializeHandle = undefined,
    deserializeHandle = undefined,
  } = {}) {
    this.typeName = typeName;
    this._createInstance = createInstance;
    this._cloneFreeUsesUniffiHandle = cloneFreeUsesUniffiHandle === true;
    this._cloneHandle = cloneHandle;
    this._cloneHandleGeneric = cloneHandleGeneric;
    this._cloneHandleRawExternal = cloneHandleRawExternal;
    this._freeHandle = freeHandle;
    this._freeHandleGeneric = freeHandleGeneric;
    this._freeHandleRawExternal = freeHandleRawExternal;
    this._handleType = handleType;
    this._serializeHandle = serializeHandle;
    this._deserializeHandle = deserializeHandle;
    this._registry =
      typeof FinalizationRegistry === "undefined"
      || (
        typeof freeHandle !== "function"
        && typeof freeHandleGeneric !== "function"
        && typeof freeHandleRawExternal !== "function"
      )
        ? null
        : new FinalizationRegistry((record) => {
            try {
              const useRawExternal =
                record.rawExternal === true
                && typeof this._freeHandleRawExternal === "function";
              const freeHandle =
                record.genericAbi === true
                  ? this._freeHandleGeneric
                  : useRawExternal
                    ? this._freeHandleRawExternal
                  : this._freeHandle;
              if (typeof freeHandle === "function") {
                freeHandle(this._cloneFreeHandle(record.handle, {
                  genericAbi: record.genericAbi === true,
                  rawExternal: useRawExternal,
                }));
              }
            } catch {
              // Finalizers must not surface user-visible errors.
            }
          });
  }

  _unregisterFinalizer(instance) {
    const token = instance[uniffiFinalizerTokenSymbol];
    if (this._registry != null && token != null) {
      this._registry.unregister(token);
    }
    instance[uniffiFinalizerTokenSymbol] = null;
  }

  _registerFinalizer(instance, handle) {
    if (this._registry == null) {
      instance[uniffiFinalizerTokenSymbol] = null;
      return;
    }

    const token = {};
    instance[uniffiFinalizerTokenSymbol] = token;
    this._registry.register(instance, handle, token);
  }

  _markDestroyed(instance) {
    instance[uniffiObjectHandleSymbol] = null;
    instance[uniffiObjectDestroyedSymbol] = true;
    instance[uniffiFinalizerTokenSymbol] = null;
    instance[uniffiObjectGenericAbiSymbol] = false;
    instance[uniffiObjectRawExternalSymbol] = false;
  }

  _normalizeHandle(handle) {
    if (handle == null) {
      return handle;
    }

    if (typeof handle === "bigint" || typeof handle === "number") {
      return normalizeUInt64(handle);
    }
    return handle;
  }

  _coerceHandle(handle) {
    if (handle == null) {
      return handle;
    }

    const handleType = resolveHandleType(this._handleType);
    if (handleType == null) {
      return this._normalizeHandle(handle);
    }

    const normalizedHandle = this._normalizeHandle(handle);
    if (typeof normalizedHandle === "bigint" || typeof normalizedHandle === "number") {
      return koffi.decode(new BigUint64Array([normalizeUInt64(normalizedHandle)]), handleType);
    }
    return koffi.as(normalizedHandle, handleType);
  }

  _cloneFreeHandle(handle, { genericAbi = false, rawExternal = false } = {}) {
    if (handle == null) {
      return handle;
    }

    if (genericAbi || rawExternal || this._cloneFreeUsesUniffiHandle) {
      return this._normalizeHandle(handle);
    }

    return this._coerceHandle(handle);
  }

  attach(instance, handle, options = undefined) {
    const normalizedHandle = requireHandle(
      this._normalizeHandle(handle),
      `${this.typeName} handle`,
    );
    const genericAbi = options?.genericAbi === true;
    const rawExternal = options?.rawExternal === true;
    const target = requireObjectInstance(instance, this.typeName);

    if (storedHandle(target) != null && target[uniffiObjectDestroyedSymbol] !== true) {
      throw new TypeError(`${this.typeName} is already bound to a live UniFFI handle.`);
    }

    Object.defineProperties(target, {
      [uniffiTypeNameSymbol]: {
        configurable: true,
        value: this.typeName,
        writable: true,
      },
      [uniffiObjectFactorySymbol]: {
        configurable: true,
        value: this,
      },
      [uniffiObjectHandleSymbol]: {
        configurable: true,
        value: normalizedHandle,
        writable: true,
      },
      [uniffiObjectDestroyedSymbol]: {
        configurable: true,
        value: false,
        writable: true,
      },
      [uniffiObjectGenericAbiSymbol]: {
        configurable: true,
        value: genericAbi,
        writable: true,
      },
      [uniffiObjectRawExternalSymbol]: {
        configurable: true,
        value: rawExternal,
        writable: true,
      },
      [uniffiFinalizerTokenSymbol]: {
        configurable: true,
        value: null,
        writable: true,
      },
    });

    this._registerFinalizer(target, {
      genericAbi,
      rawExternal,
      handle: normalizedHandle,
    });
    return target;
  }

  bless(instance, handle) {
    return this.attach(instance, handle);
  }

  create(handle) {
    return this.attach(this._createInstance(), handle);
  }

  createGenericAbi(handle) {
    return this.attach(this._createInstance(), handle, {
      genericAbi: true,
    });
  }

  createRawExternal(handle) {
    const rawHandle = requireHandle(
      this._normalizeHandle(handle),
      `${this.typeName} handle`,
    );
    const adoptedHandle =
      typeof this._cloneHandleRawExternal === "function"
        ? requireHandle(
            this._cloneHandleRawExternal(rawHandle),
            `${this.typeName} adopted handle`,
          )
        : rawHandle;
    if (
      adoptedHandle !== rawHandle
      && typeof this._freeHandleRawExternal === "function"
    ) {
      this._freeHandleRawExternal(rawHandle);
    }
    return this.attach(this._createInstance(), adoptedHandle, {
      rawExternal: true,
    });
  }

  handle(value) {
    if (!this.isInstance(value)) {
      throw new TypeError(`${this.typeName} expected an instance created by this factory.`);
    }
    const rawHandle = requireHandle(
      this._normalizeHandle(storedHandle(value)),
      `${this.typeName} handle`,
    );
    return this.usesGenericAbi(value)
      ? rawHandle
      : this._coerceHandle(rawHandle);
  }

  peekHandle(value) {
    if (!this.isInstance(value) || this.isDestroyed(value)) {
      return undefined;
    }
    return storedHandle(value);
  }

  cloneHandle(value) {
    const rawHandle = requireHandle(
      this._normalizeHandle(storedHandle(value)),
      `${this.typeName} handle`,
    );
    const genericAbi = this.usesGenericAbi(value);
    const useRawExternal =
      this.usesRawExternal(value)
      && typeof this._cloneHandleRawExternal === "function";
    const handle = this._cloneFreeHandle(rawHandle, {
      genericAbi,
      rawExternal: useRawExternal,
    });
    const cloneHandle =
      genericAbi
        ? this._cloneHandleGeneric
        : useRawExternal
          ? this._cloneHandleRawExternal
        : this._cloneHandle;
    if (typeof cloneHandle !== "function") {
      return handle;
    }
    const clonedHandle = requireHandle(
      cloneHandle(handle, value),
      `${this.typeName} cloned handle`,
    );
    if (genericAbi) {
      return clonedHandle;
    }

    if (useRawExternal) {
      return this._cloneFreeUsesUniffiHandle
        ? pointerAddress(clonedHandle)
        : this._coerceHandle(clonedHandle);
    }

    return clonedHandle;
  }

  destroy(value) {
    if (!this.isInstance(value) || this.isDestroyed(value)) {
      return false;
    }

    const rawHandle = requireHandle(
      this._normalizeHandle(storedHandle(value)),
      `${this.typeName} handle`,
    );
    const genericAbi = this.usesGenericAbi(value);
    const useRawExternal =
      this.usesRawExternal(value)
      && typeof this._freeHandleRawExternal === "function";
    const handle = this._cloneFreeHandle(rawHandle, {
      genericAbi,
      rawExternal: useRawExternal,
    });

    const freeHandle =
      genericAbi
        ? this._freeHandleGeneric
        : useRawExternal
          ? this._freeHandleRawExternal
        : this._freeHandle;
    if (typeof freeHandle === "function") {
      freeHandle(handle, value);
    }
    this._unregisterFinalizer(value);
    this._markDestroyed(value);
    return true;
  }

  isInstance(value) {
    return objectFactory(value) === this;
  }

  isDestroyed(value) {
    return this.isInstance(value)
      && (value[uniffiObjectDestroyedSymbol] === true || storedHandle(value) == null);
  }

  usesGenericAbi(value) {
    return this.isInstance(value) && value[uniffiObjectGenericAbiSymbol] === true;
  }

  usesRawExternal(value) {
    return this.isInstance(value) && value[uniffiObjectRawExternalSymbol] === true;
  }

  serializeHandle(value) {
    const rawHandle = requireHandle(
      this._normalizeHandle(storedHandle(value)),
      `${this.typeName} handle`,
    );
    if (typeof this._serializeHandle === "function") {
      return normalizeUInt64(this._serializeHandle(this.handle(value), value));
    }
    return pointerAddress(rawHandle);
  }

  deserializeHandle(serialized) {
    const normalizedHandle = normalizeUInt64(serialized);
    if (typeof this._deserializeHandle === "function") {
      return requireHandle(
        this._normalizeHandle(this._deserializeHandle(normalizedHandle)),
        `${this.typeName} handle`,
      );
    }
    return requireHandle(
      this._normalizeHandle(normalizedHandle),
      `${this.typeName} handle`,
    );
  }
}

export class FfiConverterObject {
  constructor(factory) {
    this.factory = factory;
  }

  lower(value) {
    return this.factory.cloneHandle(value);
  }

  lift(handle) {
    return this.factory.create(handle);
  }

  write(value, writer) {
    writer.writeUInt64(this.factory.serializeHandle(value));
  }

  read(reader) {
    const handle = this.factory.deserializeHandle(reader.readUInt64());
    return this.factory.createGenericAbi(handle);
  }

  allocationSize() {
    return UNIFFI_OBJECT_HANDLE_SIZE;
  }
}

export function createObjectFactory(options = undefined) {
  return new UniffiObjectFactory(options);
}

export function createObjectConverter(factory) {
  return new FfiConverterObject(factory);
}