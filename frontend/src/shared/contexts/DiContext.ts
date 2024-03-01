import { createContext, useContext } from "react";
import { UserService } from "../services/UserService";
import { AuthService } from "../services/AuthService";
import { ContactGroupService } from "../services/ContactGroupService";
import { ContactService } from "../services/ContactService";
import { MessageService } from "../services/MessageService";

const userService = new UserService();

const container = {
    AuthService: new AuthService(userService),
    ContactGroupService: new ContactGroupService(),
    ContactService: new ContactService(userService),
    MessageService: new MessageService(),
    UserService: userService,
} as const;

export const DiContext = createContext<typeof container>(container);

export function useDiContext(): typeof container {
    const container = useContext(DiContext);
    if (!container) {
        throw new Error("Container must be set in order to use the DiContext!");
    }
    return container;
}
