package main

import (
	"bufio"
	"flag"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	p2panda "github.com/p2panda/p2panda-ffi/go/p2panda_ffi"
	"github.com/p2panda/p2panda-ffi/go/p2panda_ffi/nodebuilder"
	"github.com/p2panda/p2panda-ffi/go/p2panda_ffi/topic"
)

type ephemeralStreamHandler struct{}

func (c ephemeralStreamHandler) OnMessage(e *p2panda.EphemeralMessage) {
	slog.Info(
		"arrived",
		"body", string(e.Body()),
		"author", string(e.Author().ToHex()),
		"topic", string(e.Topic().ToHex()),
	)
}

var (
	relayFlag     *string
	networkFlag   *string
	topicFlag     *string
	peerFlag      *string
	bootstrapFlag *bool
)

func parseFlags() {
	relayFlag = flag.String("relay", "https://euc1-1.relay.n0.iroh-canary.iroh.link", "iroh relay URL")
	networkFlag = flag.String("network", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2", "Network Id hex")
	topicFlag = flag.String("topic", "f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1", "Topic Id hex")
	peerFlag = flag.String("peer", "", "Public key hex for the bootstrap node")
	bootstrapFlag = flag.Bool("bootstrap", false, "Run exclusively as a bootstrap node")

	flag.Parse()
}

func awaitInterrupt() {
	done := make(chan os.Signal, 1)
	signal.Notify(done, syscall.SIGINT, syscall.SIGTERM)
	<-done
	os.Exit(0)
}

func main() {
	parseFlags()

	opts := []nodebuilder.Option{
		nodebuilder.WithNetworkId(*networkFlag),
		nodebuilder.WithRelayUrl(*relayFlag),
	}

	if *peerFlag != "" {
		opts = append(opts, nodebuilder.WithBootstrap(*peerFlag, *relayFlag))
	}

	node, err := nodebuilder.New(opts...)
	if err != nil {
		panic(err)
	}
	defer node.Destroy()

	if *bootstrapFlag {
		slog.Info("🐼 bootstrap node is up 🐼")
		slog.Info("public key", "hex", node.Id().ToHex())
		awaitInterrupt()
	}

	topicId, err := topic.NewId(*topicFlag)
	if err != nil {
		panic(err)
	}
	defer topicId.Destroy()

	ephemeralStream, err := node.EphemeralStream(topicId, ephemeralStreamHandler{})
	defer ephemeralStream.Destroy()

	slog.Info("🐼 stream is up 🐼")
	slog.Info("type messages and press enter to send")

	go func() {
		scanner := bufio.NewScanner(os.Stdin)
		for scanner.Scan() {
			if line := scanner.Text(); line != "" {
				ephemeralStream.Publish([]byte(line))
			}
		}

		if err := scanner.Err(); err != nil {
			panic(err)
		}
	}()

	awaitInterrupt()
}
