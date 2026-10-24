import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        babel({
            presets: [reactCompilerPreset()],
        }),
        tailwindcss(),
    ],
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
