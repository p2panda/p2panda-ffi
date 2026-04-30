package p2panda_ffi_test

import (
	"fmt"
	"testing"
	"time"

	p2panda "github.com/p2panda/p2panda-ffi/go/p2panda_ffi"
	"github.com/p2panda/p2panda-ffi/go/p2panda_ffi/nodebuilder"
)

var timeout = time.After(3 * time.Second)

type ephemeralStreamHandler struct {
	Count *int
	Done  chan (bool)
}

func (c ephemeralStreamHandler) OnMessage(e *p2panda.EphemeralMessage) {
	*c.Count += 1
	if *c.Count == 3 {
		c.Done <- true
	}
}

func TestNodeEphemeralStream(t *testing.T) {
	node1, err := nodebuilder.New()
	if err != nil {
		t.Fatal(err)
	}
	defer node1.Destroy()

	node2, err := nodebuilder.New()
	if err != nil {
		t.Fatal(err)
	}
	defer node2.Destroy()

	topicId := p2panda.TopicIdRandom()
	defer topicId.Destroy()

	n1Stream, err := node1.EphemeralStream(topicId, ephemeralStreamHandler{})
	defer n1Stream.Destroy()

	done := make(chan bool)
	n2Handler := ephemeralStreamHandler{Count: new(int), Done: done}
	n2Stream, err := node2.EphemeralStream(topicId, n2Handler)
	defer n2Stream.Destroy()

	for range 3 {
		n1Stream.Publish([]byte("1312"))
	}

	select {
	case <-timeout:
		t.Fatal("stream publish timed out")
	case <-done:
	}

	if *n2Handler.Count != 3 {
		t.Fatal(fmt.Errorf("expected 3 published messages, got %d", *n2Handler.Count))
	}
}
