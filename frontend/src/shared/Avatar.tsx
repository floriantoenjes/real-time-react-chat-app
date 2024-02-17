export function Avatar(props: {
    width?: string;
    height?: string;
    filename?: string;
}) {
    return (
        <div
            className={"mr-3 flex justify-center items-center"}
            style={{
                width: props.width ?? "2.5rem",
                height: props.height ?? "2.5rem",
                backgroundColor: "lightblue",
                borderRadius: "50%",
            }}
        >
            <img
                style={{ maxHeight: "100%" }}
                src={props.filename ? "avatars/" + props.filename : undefined}
            />
        </div>
    );
}
