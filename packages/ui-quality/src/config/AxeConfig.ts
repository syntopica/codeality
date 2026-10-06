export type AxeConfig = {
  /** Selectors axe leaves out, for a region or frame it cannot audit. */
  exclude: string[]
  /** How long one screen's audit may run before it is reported and skipped. */
  timeoutMs: number
}
