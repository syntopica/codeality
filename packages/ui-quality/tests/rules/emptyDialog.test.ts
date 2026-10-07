import { describe, expect, it } from 'vitest'

import { emptyDialog } from '@/rules/emptyDialog.js'
import { elementBox } from '@tests/elementBox.js'
import { ruleContext } from '@tests/ruleContext.js'
import { snapshotOf } from '@tests/snapshotOf.js'

const dialog = elementBox({ id: 0, isDialog: true, selector: 'div.drawer' })
const close = elementBox({ id: 1, parent: 0, tag: 'button', label: 'Cerrar' })

describe('emptyDialog', () => {
  it('reports an open dialog holding nothing but its close control', () => {
    expect(
      emptyDialog(snapshotOf([dialog, close]), ruleContext()).map(
        (finding) => finding.subject,
      ),
    ).toEqual(['div.drawer'])
  })
  it('passes a dialog with a link, a field, or an action of its own', () => {
    for (const part of [
      elementBox({ id: 2, parent: 0, tag: 'a', text: 'Artistas' }),
      elementBox({ id: 2, parent: 0, tag: 'input', isControl: true }),
      elementBox({ id: 2, parent: 0, tag: 'button', text: 'Guardar' }),
    ]) {
      expect(
        emptyDialog(snapshotOf([dialog, close, part]), ruleContext()),
      ).toEqual([])
    }
  })
})
