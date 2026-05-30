import { createVueApp } from './createVueApp'

export function mountApp(): void {
  const root = document.querySelector('#app')
  if (!root) {
    throw new Error('Root element "#app" not found')
  }
  createVueApp().mount(root)
}
