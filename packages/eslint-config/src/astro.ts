import astroPlugin from "eslint-plugin-astro";
import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export type AstroConfigOptions = {
  tsconfigRootDir?: string;
};

type FlatConfigLike = Record<string, unknown>;
const astroRecommended = astroPlugin.configs[
  "flat/recommended"
] as FlatConfigLike[];

export const createAstroConfig = (options: AstroConfigOptions = {}) => {
  const tsconfigRootDir = options.tsconfigRootDir ?? process.cwd();

  return [
    globalIgnores(["dist/**", ".astro/**", "coverage/**"]),
    ...astroRecommended,
    {
      files: ["**/*.astro"],
      languageOptions: {
        parserOptions: {
          parser: tseslint.parser,
          project: true,
          tsconfigRootDir,
          extraFileExtensions: [".astro"],
        },
      },
    },
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      rules: {
        "@typescript-eslint/no-confusing-void-expression": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/no-misused-promises": [
          "error",
          { checksVoidReturn: false },
        ],
      },
    },
    {
      files: ["**/*.d.ts"],
      rules: { "@typescript-eslint/triple-slash-reference": "off" },
    },
  ];
};

export default createAstroConfig;
