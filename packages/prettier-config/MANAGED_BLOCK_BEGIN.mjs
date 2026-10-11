/**
 * Opening marker of a block another tool writes into Markdown and rewrites
 * whenever it differs byte for byte: `<!-- BEGIN:turborepo-agent-rules -->`,
 * `<!-- BEGIN:nextjs-agent-rules -->`. The capture is the block's name, which
 * its `<!-- END:name -->` marker repeats.
 */
export default /^<!--\s*BEGIN:(\S+)\s*-->$/
