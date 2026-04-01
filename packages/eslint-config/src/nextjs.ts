import nextPlugin from "@next/eslint-plugin-next";
import boundaries from "eslint-plugin-boundaries";
import { globalIgnores } from "eslint/config";

export type NextjsConfigOptions = {
  tsconfigRootDir?: string;
};

const nextRules = {
  ...nextPlugin.configs["core-web-vitals"].rules,
};

export const createNextjsConfig = (_options: NextjsConfigOptions = {}) => {
  return [
    globalIgnores([
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "next-env.d.ts",
    ]),
    {
      files: ["**/*.{js,jsx,ts,tsx}"],
      plugins: {
        "@next/next": nextPlugin,
      },
      settings: {
        react: { version: "detect" },
      },
      rules: {
        ...nextRules,
      },
    },
    {
      files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
      plugins: { boundaries },
      settings: {
        "boundaries/elements": [
          { type: "app", pattern: "app/*" },
          { type: "app", pattern: "app/**/*" },
          { type: "components", pattern: "components/*" },
          { type: "components", pattern: "components/**/*" },
          { type: "shared", pattern: "lib/*" },
          { type: "shared", pattern: "hooks/*" },
          { type: "shared", pattern: "types/*" },
          { type: "shared", pattern: "store/*" },
          { type: "server", pattern: "services/*" },
          { type: "server", pattern: "actions/*" },
        ],
      },
      rules: {
        "boundaries/element-types": [
          "error",
          {
            default: "disallow",
            rules: [
              { from: ["app"], allow: ["components", "shared", "server"] },
              { from: ["components"], allow: ["components", "shared"] },
              { from: ["shared"], allow: ["shared"] },
              { from: ["server"], allow: ["server", "shared"] },
            ],
          },
        ],
      },
    },
  ];
};

export default createNextjsConfig;
