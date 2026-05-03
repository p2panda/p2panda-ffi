import { PrivateKey, NodeBuilder, TopicId } from "p2panda";

async function main() {
  const privateKey = new PrivateKey();
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
    onOperation: (operation) => {
      console.log(operation);
    },
  });

  await handler.publish({
    chatMessage: "hello!",
    showProfile: true,
  });

  await new Promise((resolve) => setTimeout(resolve, 10000));
}

main();
