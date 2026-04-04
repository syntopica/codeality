import { createAccessibilityConfig } from '@vibracomet/eslint-config/accessibility'
import { createBaseConfig } from '@vibracomet/eslint-config/base'
import { createCodeQualityConfig } from '@vibracomet/eslint-config/code-quality'
import { createNextjsConfig } from '@vibracomet/eslint-config/nextjs'

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
