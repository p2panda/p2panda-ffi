import { serialize, deserialize } from 'v8';

import * as ffi from "./p2panda_ffi/index.js";

class PublicKey {
  constructor(hexStr) {
    this.inner = ffi.PublicKey.from_hex(hexStr);
  }

  toString() {
    return this.inner.to_hex();
  }
}

class PrivateKey {
  constructor(hexStr) {
    if (hexStr) {
      this.inner = ffi.PrivateKey.from_hex(hexStr);
    } else {
      this.inner = ffi.PrivateKey.generate();
    }
  }

  publicKey() {
    return this.inner.public_key().to_hex();
  }

  toString() {
    return this.inner.to_hex();
  }
}

class NodeBuilder {
  constructor(config) {
    this.builder = new ffi.NodeBuilder();

    if (config && config.privateKey) {
      this.builder.private_key(privateKey.inner);
    }

    if (config && config.networkId) {
      let ffiNetworkId = ffi.NetworkId.from_hex(config.networkId);
      this.builder.network_id(ffiNetworkId);
    }
  }

  privateKey(privateKey) {
    if (typeof privateKey === "string") {
      let privateKey = new PrivateKey(privateKey);
      this.builder.private_key(privateKey.inner);
    } else {
      this.builder.private_key(privateKey.inner);
    }
  }

  async spawn() {
    const ffiNode = await this.builder.spawn();
    const node = new Node();
    node.inner = ffiNode;
    return node;
  }
}

class TopicId {
  constructor(hexStr) {
    if (hexStr) {
      this.inner = ffi.TopicId.from_hex(hexStr);
    } else {
      this.inner = ffi.TopicId.random();
    }
  }

  toString() {
    return this.inner.to_hex();
  }
}

class Node {
  constructor() {}

  id() {
    return this.inner.id().to_hex();
  }

  networkId() {
    return this.inner.network_id().to_hex();
  }

  async stream(topic, callback) {
    if (typeof topic === "string") {
      topic = new TopicId(topic);
    }

    const ffiHandler = await this.inner.stream(topic.inner, {
      on_event: (streamEvent) => {
        callback.onEvent(streamEvent);
      },
      on_error: (error) => {
        callback.onError(error);
      },
      on_operation: (operation, source) => {
        const author = operation.author().to_hex();
        const message = deserialize(operation.message());
        const timestamp = parseInt((operation.timestamp() / 1000n).toString());

        callback.onOperation({
          author,
          timestamp,
          message,
        });
      },
    });

    const handler = new TopicStream();
    handler.inner = ffiHandler;

    return handler;
  }
}

class TopicStream {
  constructor() {}

  async publish(value) {
    const buf = serialize(value);
    const result = await this.inner.publish(buf);
    return result.to_hex();
  }
}

async function main() {
  let privateKey = new PrivateKey();
  console.log(privateKey.publicKey());

  const builder = new NodeBuilder();
  builder.privateKey(privateKey);

  const node = await builder.spawn();
  console.log("my node id", node.id());

  const topic = new TopicId();
  console.log("topic", topic.toString());

  const handler = await node.stream(topic, {
    onEvent: (streamEvent) => {
      console.log(streamEvent);
    },
    onError: (error) => {
      console.error(error);
    },
    onOperation: (operation, source) => {
      console.log(operation);
    },
  });

  const hash = await handler.publish({
    chatMessage: "hello!",
    showProfile: true,
  });

  await new Promise(resolve => setTimeout(resolve, 10000));
}

main();
