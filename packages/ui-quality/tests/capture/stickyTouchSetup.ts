import type { StickyTouchState } from './StickyTouchState.js'

/** Browser-side setup remains a string: this package has no DOM TypeScript library. */
export const stickyTouchSetup = (state: StickyTouchState): string => `(() => {
  const {scroll, style, documentScroll = 0, rowStyle = '', sortStyle = '', headerPeer = false, markup = ''} = ${JSON.stringify(state)}
  document.querySelector('thead')?.setAttribute('style', style)
  document.querySelector('#row')?.setAttribute('style', rowStyle)
  document.querySelector('#sort')?.setAttribute('style', sortStyle)
  const rowButton = document.querySelector('#row')
  if (rowButton) rowButton.innerHTML = markup
  document.querySelector('#header-peer')?.remove()
  if (headerPeer) {
    const original = document.querySelector('#sort')
    const clone = original?.cloneNode(true)
    if (clone) {
      clone.id = 'header-peer'
      clone.style.marginLeft = '-24px'
      original?.after(clone)
    }
  }
  window.scrollTo(0, documentScroll)
  const scroller = document.querySelector('#scroller')
  if (scroller) scroller.scrollTop = scroll
})()`
