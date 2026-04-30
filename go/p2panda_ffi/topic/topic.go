package topic

import (
	p2panda "github.com/p2panda/p2panda-ffi/go/p2panda_ffi"
)

// NewId creates a new topic identifier.
func NewId(id string) (*p2panda.TopicId, error) {
	topicId, err := p2panda.TopicIdFromHex(id)
	if err != nil {
		return &p2panda.TopicId{}, err
	}
	return topicId, nil
}
