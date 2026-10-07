import { rgbaToLab } from '@/color/rgbaToLab.js'
import type { RawFinding } from '@/model/RawFinding.js'
import { DARK_CANVAS_LIGHTNESS } from '@/rules/DARK_CANVAS_LIGHTNESS.js'
import { darkFinding } from '@/rules/darkFinding.js'
import { lightFieldsOf } from '@/rules/lightFieldsOf.js'
import { pageBackdropOf } from '@/rules/pageBackdropOf.js'
import type { Rule } from '@/rules/Rule.js'

// A page that paints itself dark under `prefers-color-scheme: dark` has to
// tell the browser so too: `color-scheme: dark` themes the scrollbars and
// the native controls, and a `theme-color` for the dark media themes the
// browser's own bar. Only the dark capture of a page that really turns dark
// is judged; a page that stays light is `dark-scheme-ignored`'s concern.
export const darkSchemeIncomplete: Rule = (snapshot) => {
  if (snapshot.screen.colorScheme !== 'dark') return []
  const canvas = pageBackdropOf(snapshot.rootBackgrounds)
  if (rgbaToLab(canvas)[0] >= DARK_CANVAS_LIGHTNESS) return []
  const findings: RawFinding[] = []
  if (!snapshot.rootColorScheme.includes('dark'))
    findings.push(
      darkFinding(
        'the page is dark but sets no color-scheme: dark, so scrollbars and native controls stay light',
        'html',
        'color-scheme',
      ),
    )
  for (const field of lightFieldsOf(snapshot.elements))
    findings.push(
      darkFinding(
        `a native ${field.tag} still paints a light background on a dark page`,
        field.selector,
        `field:${field.signature}`,
      ),
    )
  if (!snapshot.hasThemeColor)
    findings.push(
      darkFinding(
        'the page is dark but has no <meta name="theme-color"> for the dark scheme, so the browser bar stays light',
        'head',
        'theme-color',
      ),
    )
  return findings
}
