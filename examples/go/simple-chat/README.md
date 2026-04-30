# simple-chat

This example implements a simple chat app inspired by
[`p2pandaapp-cli-gomod`](https://codeberg.org/pojntfx/p2panda-gobject-go/src/branch/main/examples/p2pandaapp-cli-gomod).
Peer discovery uses mDNS by default. It's also possible to connect to peers
using a local or remote bootstrap node.

## mDNS

### Terminal 1

```
go run main.go
```

### Terminal 2

```
go run main.go
```

## Bootstrap

You can build a statically linked binary with the following command. This means
you can transfer and run the bootstrap node on a remote system for testing.

```
go build --ldflags '-linkmode external -extldflags=-static -s -w' ./main.go
```

The example below only uses the local network for testing with `go run`.

### Terminal 1

```
go run main.go -bootstrap
```

This will print the bootstrap node public key (i.e. `<hex>` in examples below).

### Terminal 2

```
go run main.go -peer <hex>
```

### Terminal 3

```
go run main.go -peer <hex>
```
