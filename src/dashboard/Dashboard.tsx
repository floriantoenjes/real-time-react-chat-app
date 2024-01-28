import { Link } from "react-router-dom";
import { Button, TextField } from "@mui/material";
import { ArrowDownOnSquareIcon, FunnelIcon } from "@heroicons/react/24/outline";
import "./Dashboard.css";
export function Dashboard() {
    function contactList() {
        const contacts = [
            {
                name: "Kevin",
                time: "Gestern",
                lastMessage: "Hallo, wie geht es dir",
            },
            {
                name: "Alexander",
                time: "Gestern",
                lastMessage: "Hallo, wie geht es dir",
            },
            {
                name: "Thomas",
                time: "Gestern",
                lastMessage: "Hallo, wie geht es dir",
            },
            {
                name: "Kontakt",
                time: "Gestern",
                lastMessage: "Hallo, wie geht es dir",
            },
            {
                name: "Kontakt",
                time: "Gestern",
                lastMessage: "Hallo, wie geht es dir",
            },
        ];

        return contacts.map((c) => (
            <div className={"flex-col border"}>
                <div className={"flex justify-between"}>
                    <div>{c.name}</div>
                    <div>{c.time}</div>
                </div>
                <div>{c.lastMessage}</div>
            </div>
        ));
    }

    return (
        <div className={"h-screen"}>
            <div className={"sidebar h-full border"}>
                <div>
                    <Button>
                        <Link to="/">Sign out</Link>
                    </Button>
                </div>
                <div className={"flex"}>
                    <TextField
                        className={"w-full"}
                        label={"Suchen oder neuen Chat beginnen"}
                    />
                    <Button>
                        <FunnelIcon className={"h-8"} />
                    </Button>
                </div>
                <div className={"h-full border"}>
                    <div className={"border"}>
                        <Button
                            className={"text-start w-full"}
                            startIcon={
                                <ArrowDownOnSquareIcon className={"h-8"} />
                            }
                        >
                            Archiviert
                        </Button>
                    </div>
                    <div className={"border"}>{contactList()}</div>
                </div>
            </div>
        </div>
    );
}
