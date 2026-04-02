import "./Dashboard.css";
import React from "react";
import { Navigate } from "react-router-dom";
import { User } from "real-time-chat-backend/shared/user.contract";
import { RoutesEnum } from "../shared/enums/routes";
import { MessageProvider } from "../shared/contexts/MessageContext";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import { PeerProvider } from "../shared/contexts/PeerContext";
import { OnlineStatusProvider } from "../shared/contexts/OnlineStatusContext";
import { ContactsProvider } from "../shared/contexts/ContactsContext";

export function Dashboard(props: { user?: User }) {
    const isLoggedIn = props.user;
    if (!isLoggedIn) {
        return <Navigate to={RoutesEnum.LOGIN} />;
    }

    return (
        <div className={"h-screen flex bg-gray-100"}>
            <ContactsProvider>
                <OnlineStatusProvider>
                    <MessageProvider>
                        <PeerProvider>
                            <Sidebar />
                            <Chat />
                        </PeerProvider>
                    </MessageProvider>
                </OnlineStatusProvider>
            </ContactsProvider>
        </div>
    );
}
