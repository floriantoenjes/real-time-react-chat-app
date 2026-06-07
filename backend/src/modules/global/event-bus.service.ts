import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * EventBusService - Wrapper around NestJS EventEmitter2
 * Provides a centralized way to emit and listen to domain events
 */
@Injectable()
export class EventBusService {
    private readonly logger = new Logger(EventBusService.name);

    constructor(private readonly eventEmitter: EventEmitter2) {}

    /**
     * Emit an event asynchronously
     * @param eventName - Name of the event (e.g., 'message.sent')
     * @param payload - Event payload data
     */
    emitAsync<T>(eventName: string, payload: T): void {
        void this.eventEmitter.emitAsync(eventName, payload);
    }

    /**
     * Emit an event synchronously (use sparingly)
     * @param eventName - Name of the event
     * @param payload - Event payload data
     */
    emit<T>(eventName: string, payload: T): void {
        this.eventEmitter.emit(eventName, payload);
    }

    /**
     * Listen for an event
     * @param eventName - Name of the event to listen for
     * @param listener - Callback function when event is emitted
     */
    on<T>(eventName: string, listener: (payload: T) => void): void {
        this.eventEmitter.on(eventName, listener);
        this.logger.debug(`Registered listener for event: ${eventName}`);
    }

    /**
     * Listen for an event once (auto-remove after first emission)
     * @param eventName - Name of the event
     * @param listener - Callback function
     */
    once<T>(eventName: string, listener: (payload: T) => void): void {
        this.eventEmitter.once(eventName, listener);
    }

    /**
     * Remove a specific listener
     * @param eventName - Name of the event
     * @param listener - The listener function to remove
     */
    off<T>(eventName: string, listener: (payload: T) => void): void {
        this.eventEmitter.off(eventName, listener);
    }

    /**
     * Remove all listeners for an event
     * @param eventName - Name of the event
     */
    removeAllListeners(eventName: string): void {
        this.eventEmitter.removeAllListeners(eventName);
    }

    /**
     * Wait for an event to be emitted
     * @param eventName - Name of the event
     * @param timeoutMs - Optional timeout in milliseconds
     * @returns Promise that resolves with the event payload
     */
    waitFor<T>(eventName: string, timeoutMs?: number): Promise<T> {
        return new Promise((resolve, reject) => {
            const listener = (payload: T) => {
                this.off(eventName, listener);
                resolve(payload);
            };

            this.on(eventName, listener);

            if (timeoutMs) {
                setTimeout(() => {
                    this.off(eventName, listener);
                    reject(
                        new Error(`Timeout waiting for event: ${eventName}`),
                    );
                }, timeoutMs);
            }
        });
    }

    /**
     * Check if there are listeners for an event
     * @param eventName - Name of the event
     * @returns Number of listeners
     */
    listenerCount(eventName: string): number {
        return this.eventEmitter.listenerCount(eventName);
    }
}
