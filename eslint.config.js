import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
    js.configs.recommended,
    {
        files: ["resources/js/**/*.{js,jsx,ts,tsx}"],
        ignores: ["node_modules/**", "public/**", "vendor/**", "bootstrap/**", "storage/**", "dist/**"],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                // Browser & Common globals
                window: "readonly",
                document: "readonly",
                navigator: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                crypto: "readonly",
                console: "readonly",
                localStorage: "readonly",
                sessionStorage: "readonly",
                fetch: "readonly",
                FormData: "readonly",
                alert: "readonly",
                FileReader: "readonly",
                URL: "readonly",
                URLSearchParams: "readonly",
                Image: "readonly",
                AudioContext: "readonly",
                Event: "readonly",
                // Node/Build globals
                process: "readonly",
                module: "readonly",
                require: "readonly",
                import: "readonly",
                // Testing globals (Vitest/Jest)
                describe: "readonly",
                test: "readonly",
                it: "readonly",
                expect: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                beforeAll: "readonly",
                afterAll: "readonly",
                vi: "readonly"
            }
        },
        plugins: {
            "@typescript-eslint": typescriptEslint,
            "react": reactPlugin,
            "react-hooks": reactHooksPlugin,
        },
        rules: {
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
            "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "no-unused-vars": "off",
            // Disable no-undef since TypeScript compiler already handles type/variable safety
            "no-undef": "off",
            "no-empty": "warn",
            "no-debugger": "warn",
            "no-mixed-spaces-and-tabs": "warn",
            "no-extra-semi": "warn",
            "no-case-declarations": "warn",
            "no-control-regex": "warn",
            "no-useless-escape": "warn",
            // Downgrade ESLint 9's new useless assignment rule to warning
            "no-useless-assignment": "warn"
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
    eslintConfigPrettier,
];
