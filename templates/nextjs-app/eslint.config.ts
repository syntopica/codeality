import { createAccessibilityConfig } from '@syntopica/eslint-config/accessibility'
import { createBaseConfig } from '@syntopica/eslint-config/base'
import { createCodeQualityConfig } from '@syntopica/eslint-config/code-quality'
import { createNextjsConfig } from '@syntopica/eslint-config/nextjs'

// Layer order: base → framework → code-quality → accessibility
//
// To add project-specific boundary rules, create eslint.architecture.ts and spread it last:
//   import architecture from './eslint.architecture.ts'
//   export default [...base, ...nextjs, ...codeQuality, ...a11y, ...architecture]

import architecture from './eslint.architecture.js'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNextjsConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createCodeQualityConfig(),
  ...createAccessibilityConfig(),
  ...architecture,
]
