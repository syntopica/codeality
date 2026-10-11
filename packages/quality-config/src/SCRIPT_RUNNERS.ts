/**
 * The words after which a script name runs that script rather than a binary:
 * `pnpm type-coverage`, `pnpm run type-coverage`, `npm run type-coverage`,
 * `yarn type-coverage`. `exec` and `dlx` are deliberately absent, since
 * `pnpm exec type-coverage` does run the binary.
 */
export const SCRIPT_RUNNERS: ReadonlySet<string> = new Set([
  'pnpm',
  'yarn',
  'bun',
  'run',
  'run-s',
  'run-p',
])
