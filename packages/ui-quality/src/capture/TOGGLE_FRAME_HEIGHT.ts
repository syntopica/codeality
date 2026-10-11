import { TOGGLE_GROUP } from '@/capture/TOGGLE_GROUP.js'

/**
 * Source of a function that, given the main selector and the index of a
 * toggle group in it, returns the height of the bar the group sits in: its
 * nearest ancestor inside the main region that is sticky or draws a surface
 * (a shadow, a border on every side, a painted fill), else its parent. A
 * string, because this package compiles without the DOM library.
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
    if (surface(getComputedStyle(box))) return box.getBoundingClientRect().height
  }
  return group.parentElement.getBoundingClientRect().height
}`
