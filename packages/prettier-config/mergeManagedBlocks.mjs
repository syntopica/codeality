import createVerbatimNode from './createVerbatimNode.mjs'
import findManagedBlockEnd from './findManagedBlockEnd.mjs'
import MANAGED_BLOCK_BEGIN from './MANAGED_BLOCK_BEGIN.mjs'

/**
 * Replaces every BEGIN/END managed block under `node` with one verbatim node,
 * so Prettier keeps the tool's own line breaks inside the block and formats
 * the rest of the file as usual. Mutates the tree in place.
 *
 * @param {{ type: string, value?: string, children?: unknown[] }} node
 * @param {string} text
 */
export default function mergeManagedBlocks(node, text) {
  if (!Array.isArray(node.children)) return
  const merged = []
  for (let index = 0; index < node.children.length; index++) {
    const child = node.children[index]
    const begin =
      child.type === 'html' && child.value?.match(MANAGED_BLOCK_BEGIN)
    const endIndex = begin
      ? findManagedBlockEnd(node.children, index, begin[1])
      : -1
    if (endIndex === -1) {
      mergeManagedBlocks(child, text)
      merged.push(child)
      continue
    }
    merged.push(createVerbatimNode(child, node.children[endIndex], text))
    index = endIndex
  }
  node.children = merged
}
