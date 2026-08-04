import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

/**
 * The React version installed next to the project being linted, or `undefined`
 * when it cannot be resolved.
 *
 * `settings.react.version: 'detect'` makes `eslint-plugin-react` walk up from
 * the linted file with its own resolver, and on ESLint 10 that walk crashes:
 * `resolveBasedir` still calls `context.getFilename()`, removed in ESLint 10,
 * so every file fails with `contextOrFilename.getFilename is not a function`
 * before a single rule runs (eslint-plugin-react 7.37.5, the newest published).
 * Handing the plugin a concrete version skips detection entirely.
 *
 * Resolution is from `process.cwd()` - where ESLint is invoked - and not from
 * this package, so a consumer's own React is found rather than whichever copy
 * a hoisted install placed beside the config.
 */
export const resolveReactVersion = (): string | undefined => {
  try {
    const manifestPath = createRequire(import.meta.url).resolve(
      'react/package.json',
      { paths: [process.cwd()] },
    )
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path comes from require.resolve, not from user input
    const manifest: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'))

    return typeof manifest === 'object' &&
      manifest !== null &&
      'version' in manifest &&
      typeof manifest.version === 'string'
      ? manifest.version
      : undefined
  } catch {
    return undefined
  }
}
