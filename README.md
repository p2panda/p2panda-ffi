# FFI bindings for p2panda

> [!IMPORTANT]
> This is highly experimental and things can break & change at any point.

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
- `uniffi-bindgen` is the UniFFI CLI tool we need to generate p2panda FFI
  bindings for various languages. This tool can be compiled from this project.
- Next to these bindings you'll find GObject bindings (GLib/GObject introspection) for p2panda in [`p2panda-gobject`](https://github.com/p2panda/p2panda-gobject)

## Usage

1. First compile `uniffi-bindgen` and the p2panda library by running `cargo
   build --release`. The binary and library lands in the `target` folder. Don't
   forget to repeat this step whenever you change the Rust code.
2. From now on we can use the tool `uniffi-bindgen` via `cargo run --bin
   uniffi-bindgen --release`.
3. The p2panda library is compiled as well and ready to be used for FFI into
   other languages (Python, Go, etc.). Follow the next steps below for
   generating FFI bindings for specific languages.
4. Make sure the library is available by linking it into the right path: `ln -s
   ./target/release/libp2panda.so ./python/p2panda` or similar.

### Python

1. Run `cargo run --bin uniffi-bindgen generate ./target/release/libp2panda.so
   --language python --out-dir ./python/p2panda`.

### Go

1. Make sure you have
   [uniffi-bindgen-go](https://github.com/NordSecurity/uniffi-bindgen-go)
   installed in your Rust toolbelt.
2. Run `uniffi-bindgen-go ./target/release/libp2panda.so --out-dir ./go`.

### Node.js

1. Make sure you have
   [uniffi-bindgen-node-js](https://github.com/criccomini/uniffi-bindgen-node-js)
   installed in your Rust toolbelt.
2. Run `uniffi-bindgen-node-js generate ./target/release/libp2panda.so
   --out-dir ./nodejs/p2panda`.
