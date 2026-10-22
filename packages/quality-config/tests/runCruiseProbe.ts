import { spawnSync } from 'node:child_process'

export function runCruiseProbe(root: string, body: string) {
  const bin = new URL('../bin/', import.meta.url).href
  return spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `
    import { readCruiseCompilerOptions } from ${JSON.stringify(`${bin}readCruiseCompilerOptions.mjs`)};
    import { rebaseCruisePaths } from ${JSON.stringify(`${bin}rebaseCruisePaths.mjs`)};
    import { withCruiseTsconfig } from ${JSON.stringify(`${bin}withCruiseTsconfig.mjs`)};
    import { cruiseWorkspaceSelection } from ${JSON.stringify(`${bin}cruiseWorkspaceSelection.mjs`)};
    import crypto from 'node:crypto';
    import { syncBuiltinESMExports } from 'node:module';
    import { spawnSync } from 'node:child_process';
    import { readFileSync, statSync } from 'node:fs';
    import { resolve } from 'node:path';
    const root = ${JSON.stringify(root)};
    const config = resolve(root, 'tsconfig.json');
    const detector = ${JSON.stringify(new URL('../node_modules/dependency-cruiser/bin/dependency-cruiser.mjs', import.meta.url).pathname)};
    ${body}
  `,
    ],
    { cwd: root, encoding: 'utf8', timeout: 10_000 },
  )
}
