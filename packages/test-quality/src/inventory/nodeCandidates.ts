import { effectiveEnvironment } from '@/inventory/effectiveEnvironment.js'
import { mentionsDom } from '@/inventory/mentionsDom.js'
import { DOM_ENVIRONMENTS } from '@/model/DOM_ENVIRONMENTS.js'
import type { NodeCandidates } from '@/model/NodeCandidates.js'
import type { TestFile } from '@/model/TestFile.js'

/** Splits the files that run under a DOM into those that name one and the rest. */
export const nodeCandidates = (
  files: TestFile[],
  readSource: (file: string) => string,
): NodeCandidates => {
  const candidates = new Set<string>()
  const domFiles = new Set<string>()
  for (const { file, environment } of files) {
    const source = readSource(file)
    if (!DOM_ENVIRONMENTS.includes(effectiveEnvironment(source, environment))) {
      continue
    }
    domFiles.add(file)
    if (!mentionsDom(source)) candidates.add(file)
  }
  // A file two projects run is one file: count it once.
  return { candidates: [...candidates], domFileCount: domFiles.size }
}
