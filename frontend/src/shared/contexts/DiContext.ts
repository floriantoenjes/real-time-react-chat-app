import { createContext, useContext } from "react";
import { UserService } from "../services/UserService";
import { AuthService } from "../services/AuthService";
import { ContactGroupService } from "../services/ContactGroupService";
import { ContactService } from "../services/ContactService";
import { MessageService } from "../services/MessageService";
import { ClientService } from "../services/ClientService";
import { FileService } from "../services/FileService";
import { LoggingService } from "../services/LoggingService";
import { CoturnService } from "../services/CoturnService";

const clientService = new ClientService();
const userService = new UserService(clientService);

const container = {
    AuthService: new AuthService(userService),
    ContactGroupService: new ContactGroupService(clientService),
    ContactService: new ContactService(clientService, userService),
    CoturnService: new CoturnService(clientService),
    FileService: new FileService(clientService),
    LoggingService: new LoggingService(clientService),
    MessageService: new MessageService(clientService),
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
