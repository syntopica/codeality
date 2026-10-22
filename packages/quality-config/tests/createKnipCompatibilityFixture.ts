import { createCruiseFixture } from './createCruiseFixture'
import type { KnipCompatibilityCase } from './KnipCompatibilityCase'

export function createKnipCompatibilityFixture(
  kind: KnipCompatibilityCase,
): string {
  const files: Record<string, string> = {
    'package.json': JSON.stringify({
      name: 'knip-compatibility-fixture',
      type: 'module',
      scripts: { 'secrets:check': 'gitleaks detect' },
      devDependencies: {
        jscpd: '1.0.0',
        'type-coverage': '1.0.0',
        'dependency-cruiser': '1.0.0',
        lefthook: '1.0.0',
        'compat-peer-host': '1.0.0',
        '@eslint/js': '1.0.0',
        'eslint-plugin-promise': '1.0.0',
        'eslint-plugin-security': '1.0.0',
        'eslint-plugin-unused-imports': '1.0.0',
        'typescript-eslint': '1.0.0',
        'eslint-config-prettier': '1.0.0',
        ...(kind === 'custom' ? {} : { '@syntopica/eslint-config': '1.0.0' }),
      },
    }),
    'src/index.ts': [
      'import "compat-peer-host";',
      'import "@eslint/js";',
      'import "eslint-plugin-promise";',
      'import "eslint-plugin-security";',
      'import "eslint-plugin-unused-imports";',
      'import "typescript-eslint";',
      ...(kind === 'custom' ? [] : ['import "@syntopica/eslint-config";']),
      ...(kind === 'current' ? ['import "eslint-config-prettier";'] : []),
    ].join('\n'),
    'knip.config.ts': `import { createKnipConfig } from ${JSON.stringify(new URL('../src/knip.ts', import.meta.url).pathname)};
export default createKnipConfig({ framework: 'ts-package' });
`,
    'node_modules/compat-peer-host/package.json': JSON.stringify({
      name: 'compat-peer-host',
      version: '1.0.0',
      main: 'index.js',
      peerDependencies: {
        '@eslint/js': '*',
        'eslint-plugin-promise': '*',
        'eslint-plugin-security': '*',
        'eslint-plugin-unused-imports': '*',
        'typescript-eslint': '*',
        ...(kind === 'runner-peer' ? { 'dependency-cruiser': '*' } : {}),
      },
    }),
    'node_modules/compat-peer-host/index.js': 'module.exports = {};',
  }
  for (const name of [
    '@eslint/js',
    'eslint-plugin-promise',
    'eslint-plugin-security',
    'eslint-plugin-unused-imports',
    'typescript-eslint',
    'eslint-config-prettier',
    'dependency-cruiser',
  ]) {
    files[`node_modules/${name}/package.json`] = JSON.stringify({
      name,
      version: '1.0.0',
      main: 'index.js',
    })
    files[`node_modules/${name}/index.js`] = 'module.exports = {};'
  }
  if (kind !== 'custom') {
    files['node_modules/@syntopica/eslint-config/index.js'] =
      'module.exports = {};'
    if (kind !== 'missing-metadata')
      files['node_modules/@syntopica/eslint-config/package.json'] =
        JSON.stringify({
          name: '@syntopica/eslint-config',
          version: '1.0.0',
          main: 'index.js',
          ...(kind === 'current'
            ? { dependencies: { 'eslint-config-prettier': '*' } }
            : { peerDependencies: { 'eslint-config-prettier': '*' } }),
        })
  }
  return createCruiseFixture(files)
}
