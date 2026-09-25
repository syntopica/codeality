import { describe, expect, it } from 'vitest'

import { PACKAGE_VERSION } from '@/packageVersion.js'

describe('PACKAGE_VERSION', () => {
  it('is the semver in package.json', () => {
    expect(PACKAGE_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
