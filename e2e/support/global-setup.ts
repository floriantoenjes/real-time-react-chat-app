import { Socket } from "node:net";

const INFRA = [
    { name: "MongoDB", port: 27017 },
    { name: "Redis", port: 6379 },
    { name: "S3 mock", port: 9090 },
];

function isPortOpen(port: number, timeoutMs = 2000): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new Socket();
        const done = (open: boolean) => {
            socket.destroy();
            resolve(open);
        };
        socket.setTimeout(timeoutMs);
        socket.once("connect", () => done(true));
        socket.once("timeout", () => done(false));
        socket.once("error", () => done(false));
        socket.connect(port, "localhost");
    });
}

export default async function globalSetup() {
    const results = await Promise.all(
        INFRA.map(async (service) => ({
            ...service,
            open: await isPortOpen(service.port),
        })),
    );
    const missing = results.filter((r) => !r.open);

    if (missing.length) {
        throw new Error(
            `E2E infrastructure not reachable: ${missing
                .map((m) => `${m.name} (:${m.port})`)
                .join(", ")}.\nStart it with: npm run e2e:infra`,
        );
    }
}
