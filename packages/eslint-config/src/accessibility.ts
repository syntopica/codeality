// eslint-disable-next-line @typescript-eslint/no-require-imports
const jsxA11y = require('eslint-plugin-jsx-a11y') as {
  flatConfigs: { recommended: unknown; strict: unknown }
}

/**
 * Accessibility rules for JSX-based projects (React, Next.js, Astro).
 * Enforces WCAG compliance at lint time: alt text, ARIA roles,
 * keyboard navigation, form labels, and more.
 *
 * `strict`, not `recommended`. The two differ on the rules that catch the
 * failures a sighted mouse user never sees: a `role` on an element that
 * already has one, an interactive handler on a `div` with no keyboard
 * equivalent, a label that is adjacent to its control rather than associated
 * with it. `recommended` relaxes exactly those to keep large existing
 * codebases green, which is the wrong trade for a baseline whose templates
 * start at zero findings.
 *
 * Static analysis is half the gate: it reads the source, not the rendered
 * tree, so a violation composed at runtime is invisible to it. The templates
 * pair this with an axe assertion over the rendered component.
 *
 * Spread this as the final layer (after framework config, before architecture):
 *   ...createAccessibilityConfig()
 */
export const createAccessibilityConfig = () => [jsxA11y.flatConfigs.strict]
