import { childrenIndex } from '@/rules/childrenIndex.js'
import { MIN_ID_ROWS } from '@/rules/MIN_ID_ROWS.js'
import { MIN_ID_SHARE } from '@/rules/MIN_ID_SHARE.js'
import { OPAQUE_ID } from '@/rules/OPAQUE_ID.js'
import { rowTablesOf } from '@/rules/rowTablesOf.js'
import type { Rule } from '@/rules/Rule.js'
import { textBoxOf } from '@/rules/textBoxOf.js'

// The first column is the row's name, the thing a person scans down to find
// their record. A UUID or a 20-character token there makes them read every
// row. Order and invoice numbers are legitimate first columns, so only the
// opaque forms are judged, in at least 80% of the rows of a table or grid
// with more than five of them.
export const idFirstColumn: Rule = (snapshot) => {
  const children = childrenIndex(snapshot.elements)
  return rowTablesOf(snapshot.elements, children, MIN_ID_ROWS).flatMap(
    ({ parent, cells }) => {
      const texts = cells
        .map((row) => (row[0] ? textBoxOf(row[0], children) : null))
        .filter((box) => box !== null)
      const opaque = texts.filter((box) => OPAQUE_ID.test(box.text))
      const first = opaque[0]
      if (!first || opaque.length < cells.length * MIN_ID_SHARE) return []
      return [
        {
          rule: 'id-first-column',
          severity: 'warn',
          message: `the first column shows opaque ids (${first.text}); lead with a name a person can scan and move the id to a later column`,
          subject: first.selector,
          identity: parent?.selector ?? first.selector,
        },
      ]
    },
  )
}
