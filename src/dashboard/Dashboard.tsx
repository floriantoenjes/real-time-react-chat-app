import "./Dashboard.css";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import { useState } from "react";
import { User } from "../shared/types/User";
import { Navigate } from "react-router-dom";

export function Dashboard(props: { user: User | undefined }) {
    const [selectedContact, setSelectedContact] = useState("Alex");

    if (!props.user) {
        return <Navigate to={"/"} />;
    }

    return (
        <div className={"h-screen flex"}>
            <Sidebar
                username={props.user.username}
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
            />
            <Chat selectedContact={selectedContact} />
        </div>
    );
}
