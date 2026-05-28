import { useContext, useEffect, useState } from "react";
import { IconButton, List, ListItem, ListItemAvatar, ListItemText, Tooltip } from "@mui/material";
import { User } from "@t/user.contract";
import { useDiContext } from "../../../shared/contexts/DiContext";
import { useIgnoredUsersContext } from "../../../shared/contexts/IgnoredUsersContext";
import { Avatar } from "../../../shared/components/Avatar";
import { IgnoreConfirmationDialog } from "../../../shared/components/IgnoreConfirmationDialog";
import { useI18nContext } from "../../../i18n/i18n-react";
import {
    SnackbarLevels,
    snackbarService,
} from "../../../shared/contexts/SnackbarContext";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function IgnoredUsersList() {
    const { LL } = useI18nContext();
    const ignoredUserService = useDiContext().IgnoredUserService;
    const [ignoredUserIds] = useIgnoredUsersContext().ignoredUserIds;
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [unignoreDialogOpen, setUnignoreDialogOpen] = useState(false);
    const [userToUnignore, setUserToUnignore] = useState<User | null>(null);

    const userService = useDiContext().UserService;

    // Fetch user details for ignored user IDs
    useEffect(() => {
        (async () => {
            if (ignoredUserIds.length === 0) {
                setUsers([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const userPromises = ignoredUserIds.map((id) =>
                    userService.getUserById(id),
                );
                const usersData = await Promise.all(userPromises);
                setUsers(usersData.filter((u) => u !== null) as User[]);
            } catch (error) {
                console.error("Failed to fetch ignored users:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [ignoredUserIds.join(",")]);

    const handleUnignoreClick = (user: User) => {
        setUserToUnignore(user);
        setUnignoreDialogOpen(true);
    };

    const confirmUnignore = async () => {
        if (!userToUnignore) {
            return;
        }
        try {
            await ignoredUserService.unignoreUser(userToUnignore._id);
            snackbarService.showSnackbar(
                LL.UNIGNORE_USER_SUCCESS({ contactName: userToUnignore.username }),
                SnackbarLevels.SUCCESS,
            );
        } catch (error) {
            snackbarService.showSnackbar(
                LL.ERROR.COULD_NOT_UNIGNORE_USER(),
                SnackbarLevels.ERROR,
            );
        } finally {
            setUnignoreDialogOpen(false);
            setUserToUnignore(null);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">{LL.IGNORED_USERS()}</h2>

            {loading ? (
                <p>{LL.LOADING()}</p>
            ) : users.length === 0 ? (
                <p className="text-gray-500">{LL.NO_IGNORED_USERS()}</p>
            ) : (
                <List>
                    {users.map((user) => (
                        <ListItem
                            key={user._id}
                            secondaryAction={
                                <Tooltip title={LL.UNIGNORE()}>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleUnignoreClick(user)}
                                        color="primary"
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </IconButton>
                                </Tooltip>
                            }
                        >
                            <ListItemAvatar>
                                <Avatar user={user} width="2.5rem" height="2.5rem" />
                            </ListItemAvatar>
                            <ListItemText primary={user.username} />
                        </ListItem>
                    ))}
                </List>
            )}

            <IgnoreConfirmationDialog
                open={unignoreDialogOpen}
                onClose={() => setUnignoreDialogOpen(false)}
                onConfirm={confirmUnignore}
                contactName={userToUnignore?.username ?? ""}
                isIgnore={false}
            />
        </div>
    );
}
