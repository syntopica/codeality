import rule from '../../src/rules/no-cross-module-deep-imports.js'
import { ruleTester } from '../utils/rule-tester.js'

ruleTester.run('no-cross-module-deep-imports', rule as any, {
  valid: [
    // single-level relative — within same module
    {
      code: `import { helper } from '../utils/helper'`,
    },
    // absolute/alias import — never flagged
    {
      code: `import { helper } from '@myorg/core'`,
    },
    // two levels up but not descending into src
    {
      code: `import config from '../../config'`,
    },
    // two levels up, descending into non-internal dir
    {
      code: `import stuff from '../../packages/something/lib/stuff'`,
    },
    // custom internalDirs — 'lib' not banned by default
    {
      code: `import { x } from '../../other-module/lib/internal'`,
    },
  ],

  invalid: [
    // classic cross-module deep import
    {
      code: `import { helper } from '../../core/src/utils/helper'`,
      errors: [{ messageId: 'deepImport', data: { importPath: '../../core/src/utils/helper' } }],
    },
    // three levels up, then into src
    {
      code: `import { api } from '../../../packages/api/src/client'`,
      errors: [
        { messageId: 'deepImport', data: { importPath: '../../../packages/api/src/client' } },
      ],
    },
    // custom internalDirs option
    {
      code: `import { x } from '../../other-module/lib/internal'`,
      options: [{ internalDirs: ['lib'] }],
      errors: [
        { messageId: 'deepImport', data: { importPath: '../../other-module/lib/internal' } },
      ],
    },
    // minParentTraversals: 1 — even one level up into src is flagged
    {
      code: `import { x } from '../sibling/src/module'`,
      options: [{ minParentTraversals: 1 }],
      errors: [{ messageId: 'deepImport', data: { importPath: '../sibling/src/module' } }],
    },
  ],
})
