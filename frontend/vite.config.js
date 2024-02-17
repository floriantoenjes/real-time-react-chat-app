import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import vitePluginRequire from "vite-plugin-require";
import commonjs from "vite-plugin-commonjs";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vitePluginRequire.default(), commonjs(), react()],
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
