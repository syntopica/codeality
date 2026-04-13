import { createAccessibilityConfig } from '@busirocket/eslint-config/accessibility'
import { createBaseConfig } from '@busirocket/eslint-config/base'
import { createCodeQualityConfig } from '@busirocket/eslint-config/code-quality'
import { createNextjsConfig } from '@busirocket/eslint-config/nextjs'

// Layer order: base → framework → code-quality → accessibility
//
// To add project-specific boundary rules, create eslint.architecture.ts and spread it last:
//   import architecture from './eslint.architecture.ts'
//   export default [...base, ...nextjs, ...codeQuality, ...a11y, ...architecture]

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNextjsConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createCodeQualityConfig(),
  ...createAccessibilityConfig(),
]
