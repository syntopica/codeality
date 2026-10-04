/**
 * Tools that keep a cache only when asked, and what asking looks like. The
 * tool must be the command itself (at the start, after `&&`/`;`/`|`, or after
 * a runner like `exec`/`npx`): a cache path such as
 * `--cache-location node_modules/.cache/eslint/` names the tool too.
 */
export const UNCACHED_TOOLS: readonly { tool: string; pattern: RegExp }[] = [
  {
    tool: 'eslint',
    pattern:
      /(?:^|[;&|]\s*|\b(?:exec|npx|pnpx|bunx)\s+)eslint\b(?![^&|;]*--cache)/,
  },
  {
    tool: 'prettier',
    pattern:
      /(?:^|[;&|]\s*|\b(?:exec|npx|pnpx|bunx)\s+)prettier\b(?=[^&|;]*--(?:check|write|list-different))(?![^&|;]*--cache)/,
  },
]
