import { Autocomplete, TextField } from "@mui/material";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useHandleInputChange } from "../../../helpers";
import { useI18nContext } from "../../../i18n/i18n-react";
import { useUserContacts } from "../../../shared/hooks/useUserContacts";

export function ContactSearch(props: {
    onFilterChange: (filter: string) => void;
}) {
    const { LL } = useI18nContext();
    const { addContact, users, ADD_CONTACT_MARK } = useUserContacts();

    const [, setFormData] = useState({
        contactName: "",
    });

    const [autoCompleteKey, setAutoCompleteKey] = useState<string>("false");

    const handleInputChange = useHandleInputChange(setFormData);

    return (
        <div className={"flex"}>
            <Autocomplete
                options={users.map((u) => u.username)}
                getOptionLabel={(option) => option + ADD_CONTACT_MARK}
                onChange={(evt) => {
                    setFormData({
                        contactName: (evt.target as any).textValue,
                    });
                    addContact(evt).then(() => {
                        setFormData({ contactName: "" });
                        setAutoCompleteKey(
                            (!JSON.parse(autoCompleteKey)).toString(),
                        );
                        props.onFilterChange("");
                    });
                }}
                onInputChange={(evt: any) => {
                    if (evt.target.textContent) {
                        props.onFilterChange(evt.target.textContent);
                        return;
                    }
                    props.onFilterChange(evt.target.value);
                }}
                className={"w-full"}
                freeSolo={true}
                key={autoCompleteKey}
                isOptionEqualToValue={(option, value) => option === value}
                renderInput={(params) => (
                    <TextField
                        name={"contactName"}
                        {...params}
                        onInput={handleInputChange}
                        onBlur={handleInputChange}
                        label={
                            <div>
                                <MagnifyingGlassIcon
                                    className={"w-4 inline mr-2"}
                                />
                                {LL.ADD_CONTACT()}
                            </div>
                        }
                    />
                )}
            />
        </div>
    );
}
