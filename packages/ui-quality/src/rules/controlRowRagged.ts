import type { RawFinding } from '@/model/RawFinding.js'
import { controlRowFaults } from '@/rules/controlRowFaults.js'
import { controlRowsOf } from '@/rules/controlRowsOf.js'
import type { Rule } from '@/rules/Rule.js'

// Fields, selects and buttons side by side on one line whose boxes do not
// line up: an inline edit row where a helper text makes one cell taller and
// the field centred in the next one drops, or a 36px button next to 32px
// fields. `row-misaligned` checks columns across rows; this checks one row.
export const controlRowRagged: Rule = (snapshot, context) => {
  const { tolerance, maxGap } = context.options.controlRowRagged
  return controlRowsOf(snapshot.elements, maxGap).flatMap(
    (row): RawFinding[] => {
      const faults = controlRowFaults(row, tolerance)
      const first = row[0]
      if (faults.length === 0 || !first) return []
      return [
        {
          rule: 'control-row-ragged',
          severity: 'error',
          message: `${String(row.length)} controls on one line do not line up (${faults.join(', ')}): ${row.map((control) => `${control.selector} ${String(control.height)}px at y=${String(control.y)}`).join(', ')}; give the controls one height and align the row on one edge or centre`,
          subject: first.selector,
          identity: row.map((control) => control.selector).join('|'),
        },
      ]
    },
  )
}
