#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="${SCRIPT_DIR:-$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )}"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." >/dev/null 2>&1 && pwd)"
GO_PKG_DIR="${ROOT_DIR}/go/p2panda_ffi"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/p2panda-ffi-go-uniffi.XXXXXX")"
LIB_DIR="$ROOT_DIR/target/debug"
LIB_FILE="${ROOT_DIR}/target/debug/libp2panda_ffi.so"

cargo build --manifest-path "${ROOT_DIR}/Cargo.toml"

mkdir -p "${GO_PKG_DIR}"

uniffi-bindgen-go "${LIB_FILE}" \
  --library \
  --out-dir "${TMP_DIR}/out"

if [ -n "${1:-}" ]; then
	if [ -f "$GO_PKG_DIR/${1}" ]; then
		SELECT="$GO_PKG_DIR/${1}"
	else
		SELECT="-run ${1}"
	fi
else
	SELECT=""
fi

pushd $GO_PKG_DIR
LD_LIBRARY_PATH="${LD_LIBRARY_PATH:-}:$LIB_DIR" \
	CGO_LDFLAGS="-L$LIB_DIR" \
	CGO_ENABLED=1 \
	go test -v $SELECT
