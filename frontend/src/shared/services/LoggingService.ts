import { ClientService } from "./ClientService";
import { loggingContract } from "@t/logging.contract";

export class LoggingService {
    constructor(private readonly clientService: ClientService) {}

    log(message: string, context?: string) {
        void this.clientService.getClient(loggingContract).logMessage({
            body: {
                level: "log",
                message,
                context,
            },
        });
    }

    debug(message: string, context?: string) {
        void this.clientService.getClient(loggingContract).logMessage({
            body: {
                level: "debug",
                message,
                context,
            },
        });
    }
    verbose(message: string, context?: string) {
        void this.clientService.getClient(loggingContract).logMessage({
            body: {
                level: "verbose",
                message,
                context,
            },
        });
    }
    warn(message: string, context?: string) {
        void this.clientService.getClient(loggingContract).logMessage({
            body: {
                level: "warn",
                message,
                context,
            },
        });
    }
    error(message: string, context?: string, trace?: string) {
        void this.clientService.getClient(loggingContract).logMessage({
            body: {
                level: "error",
                message,
                context,
                trace,
            },
        });
    }
}
