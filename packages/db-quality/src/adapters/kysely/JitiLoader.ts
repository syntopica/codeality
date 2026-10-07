import type { createJiti } from 'jiti'

/** A jiti instance rooted at the consumer's project. */
export type JitiLoader = ReturnType<typeof createJiti>
