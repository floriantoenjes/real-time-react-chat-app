export function Avatar(props: any) {
    return (
        <div
            className={"mr-3"}
            style={{
                width: props.width ?? "2.5rem",
                height: props.height ?? "2.5rem",
                backgroundColor: "lightblue",
                borderRadius: "50%",
            }}
        ></div>
    );
}
