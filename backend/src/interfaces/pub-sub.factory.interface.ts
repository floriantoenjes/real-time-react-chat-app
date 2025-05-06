export const PubSubFactoryToken = 'PubSubFactoryToken';

export interface PubSubFactoryInterface<PubClientReturn> {
    getPubAndSubClients(): {
        pubClient: PubClient<PubClientReturn>;
        subClient: SubClient;
        connectionPromise: Promise<unknown>;
    };
}

export interface PubClient<T> {
    publish(channel: string, message: string): Promise<T>;
}

export interface SubClient {
    subscribe(
        channel: string,
        callback: (message: string) => void,
    ): Promise<void>;
}
