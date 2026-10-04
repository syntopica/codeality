/** `pnpm run x`, `npm run x`, `yarn x`, `bun run x`: a package script by name. */
export const SCRIPT_REFERENCE =
  /\b(?:pnpm|npm|yarn|bun)\s+(?:run\s+)?([\w:.-]+)/g
