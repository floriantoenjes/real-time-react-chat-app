export function Avatar(props: {
    width?: string;
    height?: string;
    filename?: string;
}) {
    return (
        <div
            className={"mr-3"}
            style={{
                width: props.width ?? "2.5rem",
                height: props.height ?? "2.5rem",
                backgroundColor: "lightblue",
                borderRadius: "50%",
            }}
        >
            <img
                src={props.filename ? "avatars/" + props.filename : undefined}
            />
        </div>
    );
}
