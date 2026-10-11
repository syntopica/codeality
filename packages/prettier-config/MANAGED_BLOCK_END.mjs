/**
 * Closing marker of a managed block, `<!-- END:turborepo-agent-rules -->`.
 * The capture is the name its `<!-- BEGIN:name -->` marker opened.
 */
export default /^<!--\s*END:(\S+)\s*-->$/
