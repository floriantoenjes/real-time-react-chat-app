export function MainChat() {
    function messageList() {
        const messages = [
            {
                from: "florian",
                at: new Date(),
                message: "Hallo, wie geht es dir?",
            },
            {
                from: "alex",
                at: new Date(),
                message:
                    "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",
            },
            {
                from: "florian",
                at: new Date(),
                message:
                    "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",
            },
            {
                from: "alex",
                at: new Date(),
                message:
                    "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",
            },
            {
                from: "florian",
                at: new Date(),
                message:
                    "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",
            },
            {
                from: "alex",
                at: new Date(),
                message: "Hallo, wie geht es dir?",
            },
        ];

        return messages.map((msg) => {
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
