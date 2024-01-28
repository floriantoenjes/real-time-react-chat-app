export function MainChat(props: { messages: any[] }) {
    function messageList() {
        return props.messages.map((msg) => {
            return (
                <div className={"w-full flex"}>
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

    return <div className={"p-8 bg-orange-50"}>{messageList()}</div>;
}
