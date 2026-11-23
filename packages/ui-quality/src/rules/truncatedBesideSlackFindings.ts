import type { ElementBox } from '@/model/ElementBox.js'
import type { RawFinding } from '@/model/RawFinding.js'
import { truncatedBesideSlackFinding } from '@/rules/truncatedBesideSlackFinding.js'

/** Every text truncated beside room it could have taken. */
export const truncatedBesideSlackFindings = (
  elements: ElementBox[],
): RawFinding[] =>
  elements
    .map((element) => truncatedBesideSlackFinding(element, elements))
    .filter((finding): finding is RawFinding => finding !== null)
