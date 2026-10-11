import MANAGED_BLOCK_END from './MANAGED_BLOCK_END.mjs'

/**
 * Index of the `<!-- END:name -->` sibling that closes the block opened at
 * `beginIndex`, or -1 when the block is never closed at this level.
 *
 * @param {Array<{ type: string, value?: string }>} siblings
 * @param {number} beginIndex
 * @param {string} name
 * @returns {number}
 */
export default function findManagedBlockEnd(siblings, beginIndex, name) {
  return siblings.findIndex(
    (node, index) =>
      index > beginIndex &&
      node.type === 'html' &&
      node.value?.match(MANAGED_BLOCK_END)?.[1] === name,
  )
}
