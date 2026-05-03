import asyncio
import signal
import sys

from p2panda_ffi.p2panda_ffi import Node, TopicId, TopicStreamCallback



class Callback(TopicStreamCallback):

    def on_event(self, event: StreamEvent) -> None:
        print("on event {}".format(event))

    def on_error(self, error: StreamError) -> None:
        print("on error {}".format(error))

    def on_operation(self, processed: ProcessedOperation, source: Source) -> None:
        print("{} [{}]: {}".format(
            processed.author().to_hex()[0:8],
            processed.timestamp(),
            processed.message()
        ))


async def main():
    # loop = asyncio.get_event_loop()
    # shutdown_event = asyncio.Event()
    # loop.add_signal_handler(signal.SIGTERM, shutdown_event.set)

    node = await Node.spawn()

    print("my node id: {}".format(node.id().to_hex()[0:8]))
    print("network id: {}".format(node.network_id().to_hex()[0:8]))
    print("")

    topic = TopicId.from_hex("d37a1d957c5f3b792ddb8e8d61e36b6a41ddbdbc0967f38d4fbd589245290fd3")

    stream = await node.stream(topic, Callback())

    while True:
        message = await asyncio.to_thread(sys.stdin.readline)
        msg_bytes = message.encode()
        await stream.publish(msg_bytes)

    # await shutdown_event.wait()


if __name__ == "__main__":
    asyncio.run(main())
