// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { expect, it } from 'vitest'
import { axe } from 'vitest-axe'

import TheCounter from './TheCounter.vue'

it('increments the count when the button is clicked', async () => {
  const wrapper = await mountSuspended(TheCounter)
  await wrapper.get('[data-testid="increment"]').trigger('click')
  expect(wrapper.get('[data-testid="count"]').text()).toBe('1')
})

it('has no accessibility violations', async () => {
  const wrapper = await mountSuspended(TheCounter)
  const results = await axe(wrapper.element as Element)
  expect(results).toHaveNoViolations()
})
