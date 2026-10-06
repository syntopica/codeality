import type { AxeViolation } from '@/model/AxeViolation.js'

/** What a screen reports when its axe audit never finished. */
export const axeTimeoutViolation = (timeoutMs: number): AxeViolation => ({
  id: 'axe-timeout',
  impact: 'serious',
  help: `axe did not finish within ${String(timeoutMs)} ms, so this screen has no accessibility audit; list the frame or region it hangs on in axe.exclude`,
  nodes: [],
})
