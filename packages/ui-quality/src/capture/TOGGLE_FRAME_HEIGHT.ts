import { TOGGLE_GROUP } from '@/capture/TOGGLE_GROUP.js'

/**
 * Source of a function that, given the main selector and the index of a
 * toggle group in it, returns the height of the bar the group sits in: its
 * nearest ancestor inside the main region that is sticky or draws a surface
 * (a shadow, a border on every side, a painted fill), else its parent, or
 * the group itself when its parent is the main region: a filter row placed
 * straight in the page is its own bar, and the list it filters below may
 * change length. The same holds for a surface that is a panel of records (it
 * holds a list or a table, or is a section or article under its own heading):
 * the row of that panel the group sits in is the bar. A string, because this
 * package compiles without the DOM library.
 */
export const TOGGLE_FRAME_HEIGHT = `(main, index) => {
  const region = document.querySelector(main)
  const group = region ? region.querySelectorAll(${JSON.stringify(TOGGLE_GROUP)})[index] : null
  if (!group || !group.parentElement) return 0
  const painted = (colour) => !/^rgba\\(.*,\\s*0\\)$|^transparent$/.test(colour)
  const surface = (style) =>
    style.position === 'sticky' ||
    style.boxShadow !== 'none' ||
    ['Top', 'Right', 'Bottom', 'Left'].every((side) => parseFloat(style['border' + side + 'Width']) > 0) ||
    painted(style.backgroundColor)
  for (let box = group.parentElement; box && box !== region; box = box.parentElement) {
    if (!surface(getComputedStyle(box))) continue
    const panel =
      box.querySelector('ul, ol, table, [role="list"], [role="table"], [role="grid"], [role="feed"]') ||
      (box.matches('section, article, [role="region"]') && box.querySelector('h1, h2, h3, h4, h5, h6'))
    if (!panel) return box.getBoundingClientRect().height
    const row = [...box.children].find((child) => child.contains(group))
    return (row || group).getBoundingClientRect().height
  }
  const fallback = group.parentElement === region ? group : group.parentElement
  return fallback.getBoundingClientRect().height
}`
