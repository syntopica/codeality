import { parsers } from 'prettier/plugins/markdown'
import mergeManagedBlocks from './mergeManagedBlocks.mjs'

/**
 * Prettier plugin that leaves `<!-- BEGIN:name -->` ... `<!-- END:name -->`
 * blocks in Markdown exactly as written. `turbo` and `next dev` write their
 * agent-rules blocks into AGENTS.md or CLAUDE.md as long lines and rewrite
 * them whenever they differ byte for byte, so wrapping them at 80 columns
 * starts a loop: Prettier wraps, the tool unwraps.
 *
 * @type {import('prettier').Plugin}
 */
export default {
  parsers: {
    markdown: {
      ...parsers.markdown,
      async parse(text, options) {
        const tree = await parsers.markdown.parse(text, options)
        mergeManagedBlocks(tree, text)
        return tree
      },
    },
  },
}
