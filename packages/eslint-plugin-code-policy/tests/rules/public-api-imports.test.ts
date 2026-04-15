import rule from '@/rules/public-api-imports.js'
import { ruleTester } from '@tests/utils/rule-tester.js'

ruleTester.run('public-api-imports', rule as any, {
  valid: [
    {
      code: `
      import { util } from '@my-pkg/core'
      import { Local } from './src/utils'
      import config from '../src/config'
      `,
    },
    {
      code: `
      import deep from 'some-package/lib/internal'
      `,
      options: [{ bannedSubpaths: ['/src/'] }],
    },
  ],
  invalid: [
    {
      code: `
      import { util } from '@my-pkg/core/src/utils'
      `,
      errors: [
        { messageId: 'deepImportNotAllowed', data: { importPath: '@my-pkg/core/src/utils' } },
      ],
    },
    {
      code: `
      import lib from 'dependency/src/lib'
      `,
      errors: [{ messageId: 'deepImportNotAllowed', data: { importPath: 'dependency/src/lib' } }],
    },
  ],
})
