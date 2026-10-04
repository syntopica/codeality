import { DOM_ENVIRONMENTS } from '@/model/DOM_ENVIRONMENTS.js'
import type { Finding } from '@/model/Finding.js'

/**
 * Files that build a DOM environment yet name nothing that needs one: the
 * candidates for node. Building a window per file was 61-72% of one suite's
 * time while two thirds of its files never touched it (verticagtm,
 * 2026-10-04). `measure --node-candidates` confirms which really pass.
 */
export const domWithoutDom = (
  candidates: string[],
  domFileCount: number,
): Finding[] => {
  if (candidates.length === 0) return []
  return [
    {
      rule: 'dom-environment-unused',
      severity: 'warning',
      message: `${String(candidates.length)} of ${String(domFileCount)} files run under ${DOM_ENVIRONMENTS.join('/')} but name no DOM API; run \`codeality-test measure --node-candidates\` to confirm which pass under node`,
      evidence: candidates,
    },
  ]
}
