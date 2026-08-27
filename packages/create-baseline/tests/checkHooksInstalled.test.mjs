import { describe, expect, it } from 'vitest'

import { checkHooksInstalled } from '../bin/conformance/checkHooksInstalled.mjs'

describe('checkHooksInstalled', () => {
  it('passes when .git/hooks is wired', () => {
    expect(
      checkHooksInstalled({
        hooks: { installed: true },
        deps: { lefthook: '^2' },
      }),
    ).toEqual([])
  })

  // A committed lefthook.yml is not an installed hook: lefthook only writes
  // into .git/hooks when `lefthook install` runs.
  it('warns when the config is present but the hook is not', () => {
    const [finding] = checkHooksInstalled({
      hooks: { installed: false },
      deps: { lefthook: '^2' },
    })
    expect(finding.level).toBe('warn')
    expect(finding.detail).toContain('ERR_PNPM_IGNORED_BUILDS')
  })

  it('warns differently when lefthook is not installed at all', () => {
    const [finding] = checkHooksInstalled({
      hooks: { installed: false },
      deps: {},
    })
    expect(finding.message).toContain('not installed')
  })
})
