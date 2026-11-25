import { DATE_INPUT_MARK } from '@/capture/DATE_INPUT_MARK.js'

/** Runs in the page after the probe: tags each probed date-family input with its id and picker side, returns the scroll offset. */
export const MARK_DATE_INPUTS_SCRIPT = `(() => {
  const types = ['date', 'time', 'datetime-local', 'month', 'week']
  for (const input of document.querySelectorAll('input')) {
    const id = window.__uiqIds && window.__uiqIds.get(input)
    if (id === undefined || !types.includes(input.type)) continue
    const side = getComputedStyle(input).direction === 'rtl' ? 'left' : 'right'
    input.setAttribute('${DATE_INPUT_MARK}', id + ':' + side)
  }
  return { x: window.scrollX, y: window.scrollY }
})()`
