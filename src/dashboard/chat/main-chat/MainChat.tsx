export function MainChat(props: { messages: any[] }) {
    function messageList() {
        if (!props.messages) {
            return [];
        }

        return props.messages.map((msg) => {
            return (
                <div className={"w-full flex"} key={Math.random() * 1_000_000}>
                    <div
                        className={
                            "border w-fit rounded p-3 m-3 max-w-96" +
                            (msg.from === "florian"
                                ? " ml-auto bg-green-300"
                                : " bg-white")
                        }
                    >
                        <p>{msg.message}</p>
                    </div>
                </div>
            );
        });
    }

    return <div className={"p-8 bg-orange-50 min-h-full"}>{messageList()}</div>;
}
