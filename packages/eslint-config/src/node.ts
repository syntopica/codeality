import globals from "globals";
import unicorn from "eslint-plugin-unicorn";

export const createNodeConfig = () => [
  {
    files: ["**/*.{ts,js,mjs,cjs}"],
    languageOptions: {
      globals: { ...globals.node },
    },
    plugins: { unicorn },
    rules: {
      "unicorn/prefer-node-protocol": "error",
    },
  },
];

export default createNodeConfig;
