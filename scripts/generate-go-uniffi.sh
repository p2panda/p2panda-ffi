#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"
GO_PKG_DIR="${ROOT_DIR}/go/p2panda_ffi"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/p2panda-ffi-go-uniffi.XXXXXX")"

TARGET="x86_64-unknown-linux-musl"
LIB_NAME="libp2panda_ffi.a"
LIB_FILE="${ROOT_DIR}/target/${TARGET}/release/libp2panda_ffi.a"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

apply_async_error_workaround() {
  local generated_file="$1"

  # uniffi-bindgen-go v0.7.0+v0.31.0 does not include PR #91 yet.
  # Patch the generated async helper so RustBuffer-backed error returns
  # propagate the original UniFFI error instead of panicking on an empty buffer.
  perl -0pi -e 's/"math"\n\t"runtime"/"math"\n\t"reflect"\n\t"runtime"/' "${generated_file}"
  perl -0pi -e 's/\tffiValue, err := rustCallWithError\(errConverter, func\(status \*C\.RustCallStatus\) F \{\n\t\treturn completeFunc\(rustFuture, status\)\n\t\}\)\n\treturn liftFunc\(ffiValue\), err/\tvar goValue T\n\tffiValue, err := rustCallWithError(errConverter, func(status *C.RustCallStatus) F {\n\t\treturn completeFunc(rustFuture, status)\n\t})\n\tif value := reflect.ValueOf(err); value.IsValid() && !value.IsZero() {\n\t\treturn goValue, err\n\t}\n\treturn liftFunc(ffiValue), err/' "${generated_file}"

  if ! grep -q '"reflect"' "${generated_file}" || ! grep -q 'return goValue, err' "${generated_file}"; then
    echo "failed to apply async error workaround to ${generated_file}" >&2
    exit 1
  fi
}

if ! command -v uniffi-bindgen-go >/dev/null 2>&1; then
  echo "uniffi-bindgen-go is required on PATH" >&2
  echo "Install it with:" >&2
  echo "  cargo install uniffi-bindgen-go --git https://github.com/NordSecurity/uniffi-bindgen-go --tag v0.7.0+v0.31.0" >&2
  exit 1
fi

if ! command -v rustup &> /dev/null; then
  echo "rustup not found, please install it"
  exit 1
else
  rustup target add "${TARGET}"
fi

export RUSTFLAGS="-C target-feature=+crt-static"
cargo build \
  --manifest-path "${ROOT_DIR}/Cargo.toml" \
  --lib \
  --release \
  --target "${TARGET}"

mkdir -p "${GO_PKG_DIR}/libs/${TARGET}"
cp "${LIB_FILE}" "${GO_PKG_DIR}/libs/${TARGET}/${LIB_NAME}"

if [[ -z "${LIB_FILE}" ]]; then
  echo "failed to locate built libp2panda_ffi lib under target/${TARGET}/release" >&2
  exit 1
fi

if [[ -z "${GO_PKG_DIR}/libs/${TARGET}/${LIB_NAME}" ]]; then
  echo "failed to move built libp2panda_ffi lib to ${GO_PKG_DIR}/libs/${TARGET}/${LIB_NAME}" >&2
  exit 1
fi

mkdir -p "${GO_PKG_DIR}"

uniffi-bindgen-go "${LIB_FILE}" \
  --library \
  --out-dir "${TMP_DIR}/out"

GENERATED_DIR="${TMP_DIR}/out/p2panda_ffi"

GENERATED_GO_FILE="$(find "${GENERATED_DIR}" -maxdepth 1 -type f -name '*.go' | head -n 1)"
GENERATED_H_FILE="$(find "${GENERATED_DIR}" -maxdepth 1 -type f -name '*.h' | head -n 1)"

if [[ -z "${GENERATED_GO_FILE}" || -z "${GENERATED_H_FILE}" ]]; then
  echo "unexpected generator output in ${GENERATED_DIR}" >&2
  exit 1
fi

rm -f \
  "${GO_PKG_DIR}/p2panda_ffi.go" \
  "${GO_PKG_DIR}/p2panda_ffi.h"
cp "${GENERATED_GO_FILE}" "${GO_PKG_DIR}/$(basename "${GENERATED_GO_FILE}")"
cp "${GENERATED_H_FILE}" "${GO_PKG_DIR}/$(basename "${GENERATED_H_FILE}")"
apply_async_error_workaround "${GO_PKG_DIR}/$(basename "${GENERATED_GO_FILE}")"
go -C "${GO_PKG_DIR}" fmt ./...
