# FFI bindings for p2panda

> **Please Note** This is highly experimental and things can break & change
> anytime.

## Good to know

- We're using [UniFFI](https://mozilla.github.io/uniffi-rs/latest/index.html).
  UniFFI is a tool that automatically generates foreign-language bindings
  targeting Rust libraries.
- Make sure you have [Rust](https://rust-lang.org/learn/get-started/) ready on
  your machine. We've tested this with `v1.95.0`.
- We're using [proc
  macros](https://mozilla.github.io/uniffi-rs/latest/tutorial/Rust_scaffolding.html)
  to "scaffold" everything for UniFFI from Rust, so there's no need to create
  an additional UDL file.
- `uniffi-bindgen` is the UniFFI CLI tool we need to generate a "Dynamic System
  Library" (cdylib) for p2panda from the Rust code-base. This tool can be
  compiled from this project.

## Usage

1. First compile `uniffi-bindgen` and the p2panda library by running `cargo
   build --release`. The binary and library lands in the `target` folder.
2. From now on we can use the tool `uniffi-bindgen` via `cargo run --bin
   uniffi-bindgen --release`. Don't forget to repeat the first step whenever
   you change the Rust code.
3. The p2panda library is compiled as well and ready to be used for FFI into
   other languages (Python, Go, etc.). Follow the next steps below for
   generating FFI bindings for specific languages.

### Python

1. Run `cargo run --bin uniffi-bindgen generate ./target/release/libp2panda.so
   --language python --out-dir ./python/p2panda`.
2. Make sure the library is available by linking it into the right path:
   `ln -s ./target/release/libp2panda.so ./python/p2panda`.
3. You can now run the example via `python example.py` in the `python` folder.

### Go

1. Make sure you have
   [uniffi-bindgen-go](https://github.com/NordSecurity/uniffi-bindgen-go)
   installed in your Rust toolbelt.
2. Run `uniffi-bindgen-go ./target/release/libp2panda.so --out-dir ./go`.

### Node.js

1. Make sure you have
   [uniffi-bindgen-node-js](https://github.com/criccomini/uniffi-bindgen-node-js)
   installed in your Rust toolbelt.
2. Run `uniffi-bindgen-node-js generate ./target/release/libp2panda.so --out-dir ./nodejs/p2panda`.
3. Make sure the library is available by linking it into the right path
   `ln -s ./target/release/libp2panda.so ./nodejs/p2panda`.
4. Run `node example.js` in the `nodejs` folder.
