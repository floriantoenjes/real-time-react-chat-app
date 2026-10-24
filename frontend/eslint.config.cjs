const { defineConfig, globalIgnores } = require("eslint/config");
const tsEslintPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const prettierRecommended = require("eslint-plugin-prettier/recommended");
const globals = require("globals");

module.exports = defineConfig([
    globalIgnores([
        "**/eslint.config.cjs",
        "**/vite.config.js",
        "**/tailwind.config.js",
        "**/postcss.config.js",
    ]),
    ...tsEslintPlugin.configs["flat/recommended"],
    prettierRecommended,
    {
        languageOptions: {
            parser: tsParser,
            sourceType: "module",

            parserOptions: {
                project: "tsconfig.json",
                tsconfigRootDir: __dirname,
            },

            globals: {
                ...globals.browser,
            },
        },

        rules: {
            "@typescript-eslint/interface-name-prefix": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
]);
