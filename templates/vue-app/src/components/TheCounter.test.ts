import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, expect, it } from 'vitest'
import { axe } from 'vitest-axe'

import TheCounter from './TheCounter.vue'

beforeEach(() => {
  setActivePinia(createPinia())
})

it('increments the count when the button is clicked', async () => {
  const wrapper = mount(TheCounter)
  await wrapper.get('[data-testid="increment"]').trigger('click')
  expect(wrapper.get('[data-testid="count"]').text()).toBe('1')
})

it('has no accessibility violations', async () => {
  const wrapper = mount(TheCounter)
  const results = await axe(wrapper.element as Element)
  expect(results).toHaveNoViolations()
})
