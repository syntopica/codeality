import type { CdpNode } from '@/capture/CdpNode.js'

/** What `DOM.getDocument` returns. */
export type CdpDocument = { root: CdpNode }
