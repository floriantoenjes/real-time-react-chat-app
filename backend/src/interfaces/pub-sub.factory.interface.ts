export const PubSubFactoryToken = 'PubSubFactoryToken';

export interface PubSubFactoryInterface {
    getPubAndSubClients(): {
        pubClient: PubClient;
        subClient: SubClient;
        connectionPromise: Promise<unknown>;
    };
}

export interface PubClient {
    publish(channel: string, message: string): Promise<any>;
}

export interface SubClient {
    subscribe(
        channel: string,
        callback: (message: string) => void,
    ): Promise<void>;
}
