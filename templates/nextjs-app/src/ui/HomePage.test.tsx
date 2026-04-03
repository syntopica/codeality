import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'

import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('has no obvious accessibility violations', async () => {
    const { container } = render(<HomePage />)
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    })

    expect(results.violations).toHaveLength(0)
  })
})
