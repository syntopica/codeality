import { containingFrameOf } from '@/rules/containingFrameOf.js'
import { glyphOverrunOf } from '@/rules/glyphOverrunOf.js'
import { LONG_TOKEN } from '@/rules/LONG_TOKEN.js'
import type { Rule } from '@/rules/Rule.js'
import { scrollsOnPurpose } from '@/rules/scrollsOnPurpose.js'

// "152+03+06+09+11+13+15+158+170+18+21+24+26" has no break opportunity, so
// it runs past its panel. text-clipped misses it twice: it measures the
// element's box, which a block keeps inside the panel while the glyphs spill
// out, and it stops at a scroller, as a panel with `overflow-y: auto` is
// (overflow-x computes to auto), taking the text for reachable. Here the
// glyph extent is measured against the frame the reader sees, scroller or
// not. Text a clipping frame already cuts by its box is text-clipped's.
export const unbreakableOverflow: Rule = (snapshot) =>
  snapshot.elements.flatMap((element) => {
    const token = LONG_TOKEN.exec(element.text)?.[0]
    if (!token || element.lines === 0 || element.overflowX !== 'visible')
      return []
    const frame = containingFrameOf(element, snapshot.elements)
    const past = frame ? glyphOverrunOf(element, frame) : 0
    if (!frame || past === 0) return []
    if (scrollsOnPurpose(element, frame, snapshot.elements)) return []
    return [
      {
        rule: 'unbreakable-overflow',
        severity: 'error',
        message: `"${token.slice(0, 40)}" has nowhere to break and runs ${String(past)}px past the edge of ${frame.selector}; let it wrap (overflow-wrap: anywhere) or space it`,
        subject: element.selector,
        identity: element.signature,
      },
    ]
  })
