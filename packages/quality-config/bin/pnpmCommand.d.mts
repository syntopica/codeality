/**
 * The argv prefix that runs pnpm: `[command, ...leadingArguments]`.
 *
 * Spread it ahead of pnpm's own arguments, so a machine whose `pnpm` on PATH
 * is the shebang-less pnpm placeholder is still reachable from Node.
 */
export declare function pnpmCommand(): [string, ...string[]]
