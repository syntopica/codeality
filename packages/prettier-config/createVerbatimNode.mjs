/**
 * One `html` node spanning `first` to `last` whose value is the source text
 * between them, so the Markdown printer emits that text unchanged.
 *
 * @param {{ position: { start: { offset: number }, end: { offset: number } } }} first
 * @param {{ position: { start: { offset: number }, end: { offset: number } } }} last
 * @param {string} text
 */
export default function createVerbatimNode(first, last, text) {
  return {
    type: 'html',
    value: text.slice(first.position.start.offset, last.position.end.offset),
    position: { start: first.position.start, end: last.position.end },
  }
}
