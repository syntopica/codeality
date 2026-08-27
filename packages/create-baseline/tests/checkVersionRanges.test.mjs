import { describe, expect, it } from 'vitest'

import { checkVersionRanges } from '../bin/conformance/checkVersionRanges.mjs'

const VERSIONS = { '@busirocket/prettier-config': '^0.2.0' }

describe('checkVersionRanges', () => {
  it('passes a range at or above the pin', () => {
    const deps = { '@busirocket/prettier-config': '^0.2.0' }
    expect(checkVersionRanges({ deps, versions: VERSIONS })).toEqual([])
  })

  // Thirteen repositories sat here, and no update tool could move them: a
  // caret on a 0.x line is locked to the minor.
  it('errors on a 0.x range that can never resolve the pin', () => {
    const deps = { '@busirocket/prettier-config': '^0.1.2' }
    const [finding] = checkVersionRanges({ deps, versions: VERSIONS })
    expect(finding.level).toBe('error')
    expect(finding.detail).toContain('locked to the minor')
    expect(finding.fix).toEqual({
      kind: 'set-dependency',
      name: '@busirocket/prettier-config',
      value: '^0.2.0',
    })
  })

  it('only warns when a plain install would close the gap', () => {
    const versions = { '@busirocket/eslint-config': '^0.7.3' }
    const deps = { '@busirocket/eslint-config': '^0.7.0' }
    const [finding] = checkVersionRanges({ deps, versions })
    expect(finding.level).toBe('warn')
  })

  it('ignores a package the project does not install', () => {
    expect(checkVersionRanges({ deps: {}, versions: VERSIONS })).toEqual([])
  })

  it('ignores a workspace link, which is a choice rather than drift', () => {
    const deps = { '@busirocket/prettier-config': 'workspace:*' }
    expect(checkVersionRanges({ deps, versions: VERSIONS })).toEqual([])
  })
})
