import { Contact } from "../shared/types/Contact";

export const contactsData: { [username: string]: Contact[] } = {
    florian: [
        {
            name: "Alex",
            time: "Gestern",
            lastMessage: "Hallo, wie geht es dir",
        },
        {
            name: "Kevin",
            time: "Gestern",
            lastMessage: "Hallo, wie geht es dir",
        },
    ],
    alex: [
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
    ],
};
