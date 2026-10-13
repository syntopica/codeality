import plugin from '@/index.js'
import { describe, expect, it } from 'vitest'

// Pins each preset's resolved rule map, so a preset can only change on purpose.
describe('plugin configs', () => {
  it('keeps strict, react and next as aliases of recommended', () => {
    const { recommended, strict, react, next } = plugin.configs
    expect(strict.rules).toEqual(recommended.rules)
    expect(react.rules).toEqual(recommended.rules)
    expect(next.rules).toEqual(recommended.rules)
  })

  it('limits boundaries to the import-boundary rules', () => {
    expect(plugin.configs.boundaries.rules).toEqual({
      'code-policy/public-api-imports': 'error',
      'code-policy/no-cross-module-deep-imports': 'error',
      'code-policy/no-mixed-barrel': 'error',
    })
  })

  it('enables every boundary rule in recommended at the same severity', () => {
    const recommended: Record<string, string> = plugin.configs.recommended.rules
    for (const [rule, severity] of Object.entries(
      plugin.configs.boundaries.rules,
    )) {
      expect(recommended[rule]).toBe(severity)
    }
  })
})
