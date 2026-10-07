import { ACTION_TAGS } from '@/rules/ACTION_TAGS.js'
import { ancestorsOf } from '@/rules/ancestorsOf.js'
import { itemNameOf } from '@/rules/itemNameOf.js'
import { navIconOf } from '@/rules/navIconOf.js'
import type { Rule } from '@/rules/Rule.js'

// Two navigation entries drawing the same icon (Clientes and Contactos, or
// Plantillas and Canales) leave the icon telling them apart for nothing.
export const duplicateNavIcon: Rule = (snapshot) => {
  const byIcon = new Map<string, Set<string>>()
  for (const item of snapshot.elements) {
    if (!ACTION_TAGS.has(item.tag)) continue
    if (!ancestorsOf(item, snapshot.elements).some((a) => a.tag === 'nav'))
      continue
    const icon = navIconOf(item, snapshot.elements)
    const name = itemNameOf(item, snapshot.elements)
    if (!icon || name === '') continue
    byIcon.set(
      icon.svgDigest,
      (byIcon.get(icon.svgDigest) ?? new Set()).add(name),
    )
  }
  return [...byIcon]
    .filter(([, names]) => names.size > 1)
    .map(([digest, names]) => ({
      rule: 'duplicate-nav-icon',
      severity: 'warn',
      message: `${[...names].map((name) => `"${name}"`).join(', ')} draw the same icon in the navigation; give each its own`,
      subject: [...names].join(' / '),
      identity: digest,
    }))
}
