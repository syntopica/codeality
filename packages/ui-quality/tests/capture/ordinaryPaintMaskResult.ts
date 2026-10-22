import { readFileSync } from 'node:fs'
import { Script, createContext } from 'node:vm'

import { ORDINARY_PAINT_STYLE } from './ORDINARY_PAINT_STYLE.js'

/** Exercise the authoring helper directly without claiming browser CSS support or paint. */
export const ordinaryPaintMaskResult = (
  sources: Record<string, string>,
): unknown => {
  const source = readFileSync(
    new URL('../../assets/probe/ordinaryPaint.js', import.meta.url),
    'utf8',
  )
  const element = {
    matches: () => false,
    getAnimations: () => [],
    shadowRoot: null,
    tagName: 'THEAD',
  }
  const context = createContext({
    element,
    document: { documentElement: element },
    getComputedStyle: (_element: unknown, pseudo?: string) =>
      pseudo
        ? { content: 'none' }
        : {
            ...ORDINARY_PAINT_STYLE,
            getPropertyValue: (property: string) => sources[property] ?? '',
          },
  })
  return new Script(
    `${source.replace('export const ordinaryPaint =', 'const ordinaryPaint =')}\nordinaryPaint(element)`,
  ).runInContext(context, { timeout: 1000 }) as unknown
}
