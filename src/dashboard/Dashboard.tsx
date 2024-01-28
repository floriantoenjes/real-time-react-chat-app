import "./Dashboard.css";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import { useState } from "react";

export function Dashboard() {
    const [selectedContact, setSelectedContact] = useState("Alex");

    return (
        <div className={"h-screen flex"}>
            <Sidebar
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
            />
            <Chat selectedContact={selectedContact} />
        </div>
    );
}
