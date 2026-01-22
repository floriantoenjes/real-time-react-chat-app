import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import commonjs from "vite-plugin-commonjs";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [commonjs(), react(), tailwindcss()],
    base: "/frontend/",
    // build: {
    //     sourcemap: "inline", // TODO: Comment out after debugging
    // },
    resolve: {
        alias: [
            {
                find: "@",
                replacement: fileURLToPath(
                    new URL("../backend/", import.meta.url),
                ),
            },
            {
                find: "@t",
                replacement: fileURLToPath(
                    new URL("../backend/shared", import.meta.url),
                ),
            },
        ],
    },
});
