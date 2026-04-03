import { useContext, useState } from "react";
import { ContactsContext } from "../../shared/contexts/ContactsContext";
import { TopSection } from "./top-section/TopSection";
import { ContactSearch } from "./contact-search/ContactSearch";
import { ContactList } from "./contact-list/ContactList";

export function Sidebar() {
    const contactsContext = useContext(ContactsContext);

    const [selectedContact] = contactsContext.selectedContact;

    const [nameFilter, setNameFilter] = useState<string | undefined>();

    return (
        <div
            className={
                "sidebar h-screen bg-white" +
                (selectedContact ? " hidden md:block" : "")
            }
        >
            <TopSection />
            <ContactSearch onFilterChange={setNameFilter} />
            <div>
                <ContactList nameFilter={nameFilter} />
            </div>
        </div>
    );
}
