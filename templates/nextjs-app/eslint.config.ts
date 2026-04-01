import { createBaseConfig } from '@repo/eslint-config/base'
import { createCodeQualityConfig } from '@repo/eslint-config/code-quality'
import { createNextjsConfig } from '@repo/eslint-config/nextjs'

// Layer order: base → framework → code-quality → (optional) project architecture
//
// To add project-specific boundary rules, create eslint.architecture.ts and spread it last:
//   import architecture from './eslint.architecture.ts'
//   export default [...base, ...nextjs, ...codeQuality, ...architecture]

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNextjsConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createCodeQualityConfig(),
]
