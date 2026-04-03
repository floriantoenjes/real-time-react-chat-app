import "./Dashboard.css";
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { RoutesEnum } from "../shared/enums/routes";
import { MessageProvider } from "../shared/contexts/MessageContext";
import { Sidebar } from "./sidebar/Sidebar";
import { Chat } from "./chat/Chat";
import { PeerProvider } from "../shared/contexts/PeerContext";
import { OnlineStatusProvider } from "../shared/contexts/OnlineStatusContext";
import { ContactsProvider } from "../shared/contexts/ContactsContext";
import { UserContext } from "../shared/contexts/UserContext";

export function Dashboard() {
    const [loggedInUser] = useContext(UserContext);

    if (!loggedInUser) {
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
