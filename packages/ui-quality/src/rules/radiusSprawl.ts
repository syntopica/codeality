import { MAX_RADII } from '@/rules/MAX_RADII.js'
import { radiiOf } from '@/rules/radiiOf.js'
import type { Rule } from '@/rules/Rule.js'

// A radius scale has three or four steps. Five or more distinct corner radii
// in the main region, pills and circles aside, is a screen built from
// whatever each component came with. The concentric half of the candidate
// (a child radius not smaller than its parent's) is not checked: a flush
// child with no padding is concentric at the same radius, and a padded one is
// already `nested-cards`.
export const radiusSprawl: Rule = (snapshot) => {
  const radii = radiiOf(snapshot.elements)
  if (radii.length <= MAX_RADII) return []
  const main = snapshot.elements.find((element) => element.isMain)
  return [
    {
      rule: 'radius-sprawl',
      severity: 'warn',
      message: `the main region uses ${String(radii.length)} corner radii (${radii.map(String).join(', ')}px); keep to a scale of ${String(MAX_RADII)} or fewer`,
      subject: main?.selector ?? 'main',
      identity: 'radius-scale',
    },
  ]
}
