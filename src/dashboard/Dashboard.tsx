import "./Dashboard.css";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";

export function Dashboard() {
    return (
        <div className={"h-screen flex"}>
            <Sidebar />
            <Chat />
        </div>
    );
}
