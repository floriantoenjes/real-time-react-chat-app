import { createContext, Dispatch, SetStateAction } from "react";
import { Contact } from "../types/Contact";

export const ContactsContext = createContext<
    [Contact[], Dispatch<SetStateAction<Contact[]>>]
>([[], (value) => {}]);
