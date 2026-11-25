/** What `DOM.getBoxModel` returns that this package reads: the border quad, as eight numbers. */
export type CdpBoxModel = { model: { border: number[] } }
