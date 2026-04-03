import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'

import { App } from './App'

describe('App', () => {
  it('has no obvious accessibility violations', async () => {
    const { container } = render(<App />)
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    })

    expect(results.violations).toHaveLength(0)
  })
})
