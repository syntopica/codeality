import { createCruiseFixture } from './createCruiseFixture'

export function createDevDependencyFixture(config: string): string {
  return createCruiseFixture({
    '.dependency-cruiser.json': config,
    'tsconfig.json': '{}',
    'package.json': '{"name":"fixture-root","private":true}',
    'packages/app/package.json': JSON.stringify({
      name: 'fixture-app',
      dependencies: { 'production-package': '1.0.0' },
      devDependencies: {
        'development-package': '1.0.0',
        'type-package': '1.0.0',
        'required-peer': '1.0.0',
        'optional-peer': '1.0.0',
        'declaration-runtime': '1.0.0',
      },
      peerDependencies: {
        'required-peer': '>=1.0.0',
        'optional-peer': '>=1.0.0',
      },
      peerDependenciesMeta: { 'optional-peer': { optional: true } },
    }),
    'packages/app/src/development.ts':
      'import { value } from "development-package"; export const result = value;',
    'packages/app/src/type.ts':
      'import type { Counter } from "type-package"; export type Result = Counter;',
    'packages/app/src/required.ts':
      'import { value } from "required-peer"; export const result = value;',
    'packages/app/src/optional.ts':
      'import { value } from "optional-peer"; export const result = value;',
    'packages/app/src/production.ts':
      'import { value } from "production-package"; export const result = value;',
    'packages/app/src/declaration.ts':
      'import { value } from "declaration-runtime"; export const result = value;',
    'packages/app/node_modules/development-package/package.json':
      '{"name":"development-package","version":"1.0.0","main":"index.js"}',
    'packages/app/node_modules/development-package/index.js':
      'exports.value = 1;',
    'packages/app/node_modules/type-package/package.json':
      '{"name":"type-package","version":"1.0.0","main":"index.d.ts"}',
    'packages/app/node_modules/type-package/index.d.ts':
      'export interface Counter { count: number }',
    'packages/app/node_modules/required-peer/package.json':
      '{"name":"required-peer","version":"1.0.0","main":"index.js"}',
    'packages/app/node_modules/required-peer/index.js': 'exports.value = 1;',
    'packages/app/node_modules/optional-peer/package.json':
      '{"name":"optional-peer","version":"1.0.0","main":"index.js"}',
    'packages/app/node_modules/optional-peer/index.js': 'exports.value = 1;',
    'packages/app/node_modules/production-package/package.json':
      '{"name":"production-package","version":"1.0.0","main":"index.js"}',
    'packages/app/node_modules/production-package/index.js':
      'exports.value = 1;',
    'packages/app/node_modules/declaration-runtime/package.json':
      '{"name":"declaration-runtime","version":"1.0.0","main":"index.d.ts"}',
    'packages/app/node_modules/declaration-runtime/index.d.ts':
      'export declare const value: number;',
  })
}
