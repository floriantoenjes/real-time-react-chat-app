import { createContext, useContext } from "react";
import { UserService } from "../services/UserService";
import { AuthService } from "../services/AuthService";
import { ContactGroupService } from "../services/ContactGroupService";
import { ContactService } from "../services/ContactService";
import { MessageService } from "../services/MessageService";
import { ClientService } from "../services/ClientService";
import { FileService } from "../services/FileService";
import { AudioService } from "../services/AudioService";

const clientService = new ClientService();
const userService = new UserService(clientService);

const container = {
    AudioService: new AudioService(),
    AuthService: new AuthService(clientService, userService),
    ContactGroupService: new ContactGroupService(clientService),
    ContactService: new ContactService(clientService, userService),
    FileService: new FileService(clientService),
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
