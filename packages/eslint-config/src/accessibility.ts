// eslint-disable-next-line @typescript-eslint/no-require-imports
const jsxA11y = require("eslint-plugin-jsx-a11y") as {
  flatConfigs: { recommended: unknown; strict: unknown };
};

/**
 * Accessibility rules for JSX-based projects (React, Next.js, Astro).
 * Enforces WCAG compliance at lint time: alt text, ARIA roles,
 * keyboard navigation, form labels, and more.
 *
 * Spread this as the final layer (after framework config, before architecture):
 *   ...createAccessibilityConfig()
 */
export const createAccessibilityConfig = () => [
  jsxA11y.flatConfigs.recommended,
];

export default createAccessibilityConfig;
