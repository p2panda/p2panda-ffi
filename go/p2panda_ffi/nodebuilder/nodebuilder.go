package nodebuilder

import (
	"errors"

	p2panda "github.com/p2panda/p2panda-ffi/go/p2panda_ffi"
)

type Option func(*p2panda.NodeBuilder) error

// New creates a new p2panda Node.
func New(options ...Option) (*p2panda.Node, error) {
	var err error

	nodeBuilder := p2panda.NewNodeBuilder()
	defer nodeBuilder.Destroy()

	for _, opt := range options {
		if optErr := opt(nodeBuilder); optErr != nil {
			err = errors.Join(err, optErr)
		}
	}

	node, spawnErr := nodeBuilder.Spawn()
	if spawnErr != nil {
		err = errors.Join(err, spawnErr)
	}

	return node, err
}

func WithDatabaseUrl(databaseUrl string) Option {
	return func(n *p2panda.NodeBuilder) error {
		if err := n.DatabaseUrl(databaseUrl); err != nil {
			return err
		}
		return nil
	}
}

func WithNetworkId(id string) Option {
	return func(n *p2panda.NodeBuilder) error {
		networkId, err := p2panda.NetworkIdFromHex(id)
		if err != nil {
			return err
		}

		if err := n.NetworkId(networkId); err != nil {
			return err
		}

		return nil
	}
}

func WithRelayUrl(url string) Option {
	return func(n *p2panda.NodeBuilder) error {
		relayUrl, err := p2panda.RelayUrlFromStr(url)
		if err != nil {
			return err
		}

		if err := n.RelayUrl(relayUrl); err != nil {
			return err
		}

		return nil
	}
}

func WithBootstrap(publicKey, relayUrl string) Option {
	return func(n *p2panda.NodeBuilder) error {
		pk, err := p2panda.PublicKeyFromHex(publicKey)
		if err != nil {
			return err
		}

		r, err := p2panda.RelayUrlFromStr(relayUrl)
		if err != nil {
			return err
		}

		if err := n.Bootstrap(pk, r); err != nil {
			return err
		}

		return nil
	}
}

func WithMdnsMode(mode p2panda.MdnsDiscoveryMode) Option {
	return func(n *p2panda.NodeBuilder) error {
		if err := n.MdnsMode(mode); err != nil {
			return err
		}

		return nil
	}
}
