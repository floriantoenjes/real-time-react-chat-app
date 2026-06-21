import { useEffect, useState } from "react";
import {
    IconButton,
    List,
    ListItem,
    ListItemText,
    Tooltip,
} from "@mui/material";
import { ContactGroup } from "@t/contact-group.contract";
import { useContext } from "react";
import { ContactsContext } from "../../../shared/contexts/ContactsContext";
import { useI18nContext } from "../../../i18n/i18n-react";
import {
    SnackbarLevels,
    snackbarService,
} from "../../../shared/contexts/SnackbarContext";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export function LeftGroupsList() {
    const { LL } = useI18nContext();
    const contactsContext = useContext(ContactsContext);
    const leftGroups = contactsContext.leftGroups[0];
    const rejoinGroup = contactsContext.rejoinGroup;

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, []);

    const handleRejoinClick = async (groupId: string, groupName: string) => {
        try {
            const success = await rejoinGroup(groupId);
            if (success) {
                snackbarService.showSnackbar(
                    LL.REJOIN_GROUP_SUCCESS({ groupName }),
                    SnackbarLevels.SUCCESS,
                );
            }
        } catch (error) {
            snackbarService.showSnackbar(
                LL.ERROR.COULD_NOT_REJOIN_GROUP(),
                SnackbarLevels.ERROR,
            );
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">{LL.LEFT_GROUPS()}</h2>

            {loading ? (
                <p>{LL.LOADING()}</p>
            ) : leftGroups.length === 0 ? (
                <p className="text-gray-500">{LL.NO_LEFT_GROUPS()}</p>
            ) : (
                <List>
                    {leftGroups.map((group) => (
                        <ListItem
                            key={group._id}
                            secondaryAction={
                                <Tooltip title={LL.REJOIN_GROUP()}>
                                    <IconButton
                                        edge="end"
                                        onClick={() =>
                                            handleRejoinClick(
                                                group._id,
                                                group.name,
                                            )
                                        }
                                        color="primary"
                                    >
                                        <ArrowPathIcon className="w-5 h-5" />
                                    </IconButton>
                                </Tooltip>
                            }
                        >
                            <ListItemText primary={group.name} />
                        </ListItem>
                    ))}
                </List>
            )}
        </div>
    );
}
