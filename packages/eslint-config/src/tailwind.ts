// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwindcss = require("eslint-plugin-tailwindcss") as {
  configs: { "flat/recommended": unknown[] };
};

/**
 * Tailwind CSS lint rules.
 * Enforces class ordering, detects contradicting classes (e.g. `flex block`),
 * promotes shorthands (e.g. `pt-4 pb-4` → `py-4`), and rejects unknown class names.
 *
 * Requires `tailwindcss` to be installed in the consuming project.
 * Only add this to projects that use Tailwind CSS.
 */
export const createTailwindConfig = () =>
  tailwindcss.configs["flat/recommended"];

export default createTailwindConfig;
