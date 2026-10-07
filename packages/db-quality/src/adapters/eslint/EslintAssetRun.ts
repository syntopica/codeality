import type { EslintFamily } from '@/adapters/eslint/EslintFamily.js'

/** One ESLint run over the project with a config shipped in assets/. */
export type EslintAssetRun = {
  asset: string
  roots: string[]
  env: Record<string, string>
  family: EslintFamily
  installHint: string
}
