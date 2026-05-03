build:
	cargo build --release

ffi-python:
	cargo run \
		--bin uniffi-bindgen generate ./target/release/libp2panda_ffi.so \
		--language python \
		--out-dir ./python/p2panda_ffi

ffi-nodejs:
	uniffi-bindgen-node-js generate ./target/release/libp2panda_ffi.so \
		--out-dir ./nodejs/p2panda_ffi

clean:
	rm -rf ./target
