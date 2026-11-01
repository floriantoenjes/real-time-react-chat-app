import { expect, test } from "@playwright/test";
import { io, Socket } from "socket.io-client";
import { ApiClient, createUser, TestUser } from "../../support/api";
import { BACKEND_URL } from "../../support/urls";
import { SocketMessageTypes } from "../../../backend/shared/socket-message-types.enum";
import type { Message } from "../../../backend/shared/message.contract";
import type { SocketConnectErrorData } from "../../../backend/shared/socket-connect-error";
import { ExternalErrors } from "../../../backend/shared/enums/errors.enum";

/**
 * The socket room is derived from the verified access token. A client that
 * claims another user's id in the handshake must not receive that user's events.
 * Authentication runs in the connection middleware, so `connect` on the client
 * means the socket is authenticated and in its room: tests can emit right away.
 */
test.describe("Socket authentication", () => {
    const sockets: Socket[] = [];

    function connect(user: TestUser, claimedUserId = user._id) {
        const socket = io(BACKEND_URL, {
            query: { userId: claimedUserId },
            transports: ["websocket"],
            extraHeaders: { cookie: `accessToken=${user.accessToken}` },
            reconnection: false,
        });
        sockets.push(socket);
        return new Promise<Socket>((resolve, reject) => {
            socket.once("connect", () => resolve(socket));
            socket.once("connect_error", reject);
        });
    }

    function collect<T>(socket: Socket, event: string) {
        const received: T[] = [];
        socket.on(event, (payload: T) => received.push(payload));
        return received;
    }

    test.afterEach(() => {
        sockets.splice(0).forEach((socket) => socket.disconnect());
    });

    test("a user cannot join another user's room via the handshake", async () => {
        const [victim, sender, attacker] = await Promise.all([
            createUser("Victim"),
            createUser("Sender"),
            createUser("Attacker"),
        ]);
        const senderApi = await ApiClient.create(sender);
        const victimApi = await ApiClient.create(victim);

        try {
            await senderApi.addContact(victim._id);
            await victimApi.addContact(sender._id);

            const victimSocket = await connect(victim);
            const attackerSocket = await connect(attacker, victim._id);
            const victimInbox = collect<Message>(
                victimSocket,
                SocketMessageTypes.message,
            );
            const attackerInbox = collect<Message>(
                attackerSocket,
                SocketMessageTypes.message,
            );

            const secret = `secret ${Date.now()}`;
            await senderApi.sendMessage(victim._id, secret);

            // Positive control: the event is delivered to the real recipient
            await expect
                .poll(() => victimInbox.map((m) => m.message))
                .toContain(secret);
            // Room events are emitted in one go, so the attacker would have
            // received it by now; give the Redis adapter a little extra time
            await new Promise((resolve) => setTimeout(resolve, 500));
            expect(attackerInbox).toEqual([]);
        } finally {
            await senderApi.dispose();
            await victimApi.dispose();
        }
    });

    test("rejects a connection with an invalid token before it connects", async () => {
        const user = await createUser("Forger");

        const error = await connect({
            ...user,
            accessToken: `${user.accessToken}tampered`,
        }).then(
            () => undefined,
            (err: Error & { data?: SocketConnectErrorData }) => err,
        );

        expect(error?.data?.errorCode).toBe(ExternalErrors.EXT_AUTH_002);
    });

    test("typing events carry the sender from the token, not the payload", async () => {
        const [victim, attacker] = await Promise.all([
            createUser("Victim"),
            createUser("Attacker"),
        ]);

        const victimSocket = await connect(victim);
        const attackerSocket = await connect(attacker);
        const victimTyping = collect<{ userId: string; isTyping: boolean }>(
            victimSocket,
            SocketMessageTypes.typing,
        );

        attackerSocket.emit(SocketMessageTypes.typing, {
            userId: "someone-else",
            contactId: victim._id,
            isTyping: true,
        });

        await expect.poll(() => victimTyping.length).toBe(1);
        expect(victimTyping[0]).toEqual({
            userId: attacker._id,
            isTyping: true,
        });
    });
});
