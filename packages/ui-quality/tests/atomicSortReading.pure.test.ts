import { columnOrderOf } from '@/behaviour/columnOrderOf.js'
import { sortKeyOf } from '@/behaviour/sortKeyOf.js'
import { cellSortReadings } from '@/capture/cellSortReadings.js'
import { sortKeyFromReading } from '@/capture/sortKeyFromReading.js'
import { describe, expect, it } from 'vitest'
import { COUNT_YEAR_TEXT } from './COUNT_YEAR_TEXT.js'
import { fakeSortCell } from './fakeSortCell.js'
import { fakeSortDeclaration } from './fakeSortDeclaration.js'
import { firstSortReading } from './firstSortReading.js'
import { ISO_DATE } from './ISO_DATE.js'
import { cellSortTexts as legacyCellSortTexts } from './legacy/cellSortTexts.js'

describe('atomic sort evidence (pure DOM-capability doubles)', () => {
  it('preserves failure for non-HTML time-like descendants without innerText', () => {
    const cell = {
      innerText: 'shown',
      querySelector: () => ({ getAttribute: () => ISO_DATE }),
      querySelectorAll: () => [],
    }
    expect(() => cellSortReadings([cell])).toThrow(TypeError)
  })

  it('matches the frozen legacy reader text exactly for supported HTML cells', () => {
    const time = { innerText: '2 jun 2021', getAttribute: () => ISO_DATE }
    const cells = [
      fakeSortCell('  untouched\n text  '),
      fakeSortCell(' 2 jun 2021 title', [], time),
      fakeSortCell('title\n2 jun 2021', [], time),
      fakeSortCell('USD\n1 234,50'),
      fakeSortCell(COUNT_YEAR_TEXT, [fakeSortDeclaration('1')]),
    ]
    expect(cellSortReadings(cells).map((reading) => reading.text)).toEqual(
      legacyCellSortTexts(cells),
    )
  })

  it('preserves count ties, opposite orders and genuine wrong-order detection', () => {
    const keys = cellSortReadings([
      fakeSortCell(COUNT_YEAR_TEXT, [fakeSortDeclaration('1')]),
      fakeSortCell('1 año\n2024', [fakeSortDeclaration('1')]),
      fakeSortCell('2 años\n2025 · 2023', [fakeSortDeclaration('2')]),
    ]).map(sortKeyFromReading)
    expect(keys).toEqual([1, 1, 2])
    expect(columnOrderOf(keys)).toBe('asc')
    expect(
      columnOrderOf([
        ...keys.slice(1, 2),
        ...keys.slice(0, 1),
        ...keys.slice(2),
      ]),
    ).toBe('asc')
    expect(columnOrderOf(keys.toReversed())).toBe('desc')
    expect(columnOrderOf([...keys.slice(2), ...keys.slice(0, 2)])).toBe('desc')
    expect(
      columnOrderOf([
        ...keys.slice(0, 1),
        ...keys.slice(2),
        ...keys.slice(1, 2),
      ]),
    ).toBe('none')
  })
  it.each(['', 'NaN', 'Infinity', '1e3', '1\n2026', '9'.repeat(400)])(
    'keeps exact fallback for invalid declared number %j',
    (value) => {
      const reading = firstSortReading(
        fakeSortCell(COUNT_YEAR_TEXT, [fakeSortDeclaration(value)]),
      )
      expect(reading.text).toBe(COUNT_YEAR_TEXT)
      expect(sortKeyFromReading(reading)).toBe(sortKeyOf(COUNT_YEAR_TEXT))
    },
  )
  it('does not infer absent/unsupported type and accepts zero', () => {
    expect(
      cellSortReadings([fakeSortCell('1\n2026')]).map(sortKeyFromReading),
    ).toEqual(['1 2026'])
    expect(
      cellSortReadings([
        fakeSortCell('1\n2026', [fakeSortDeclaration('1', null)]),
      ]).map(sortKeyFromReading),
    ).toEqual(['1 2026'])
    expect(
      cellSortReadings([
        fakeSortCell('1\n2026', [fakeSortDeclaration('1', 'text')]),
      ]).map(sortKeyFromReading),
    ).toEqual(['1 2026'])
    expect(
      cellSortReadings([
        fakeSortCell('0 años', [fakeSortDeclaration('0')]),
      ]).map(sortKeyFromReading),
    ).toEqual([0])
  })
  it('falls back for duplicate declarations even when one is hidden', () => {
    const readings = cellSortReadings([
      fakeSortCell('1\n2026', [
        fakeSortDeclaration('1'),
        fakeSortDeclaration('2026', 'number', false),
      ]),
    ])
    expect(readings.at(0)?.declaration).toBeNull()
    expect(readings.map(sortKeyFromReading)).toEqual(['1 2026'])
  })
  it('falls back for hidden, zero-geometry and unsupported visibility declarations', () => {
    const unsupported = fakeSortDeclaration('1')
    delete unsupported.checkVisibility
    for (const declaration of [
      fakeSortDeclaration('1', 'number', false),
      fakeSortDeclaration('1', 'number', true, []),
      fakeSortDeclaration('1', 'number', true, [{ width: 0, height: 10 }]),
      fakeSortDeclaration('1', 'number', true, [{ width: 10, height: 0 }]),
      unsupported,
    ]) {
      const reading = firstSortReading(fakeSortCell('1\n2026', [declaration]))
      expect(reading.declaration).toBeNull()
      expect(sortKeyFromReading(reading)).toBe('1 2026')
    }
  })
  it('retains EXACT leading-time and raw text construction', () => {
    const time = { innerText: '2 jun 2021', getAttribute: () => ISO_DATE }
    expect(
      firstSortReading(fakeSortCell(' 2 jun 2021 title', [], time)).text,
    ).toBe(ISO_DATE)
    expect(
      firstSortReading(fakeSortCell('title\n2 jun 2021', [], time)).text,
    ).toBe('title\n2 jun 2021')
    expect(firstSortReading(fakeSortCell('  untouched\n text  ')).text).toBe(
      '  untouched\n text  ',
    )
  })
  it('preserves unmarked wrapped currency and USD fallback', () => {
    expect(
      cellSortReadings(
        ['-2\n€', '0\n€', '1 234,50\n€', 'USD\n1 234,50', '1,25\n%'].map(
          (text) => fakeSortCell(text),
        ),
      ).map(sortKeyFromReading),
    ).toEqual([-2, 0, 1234.5, 1234.5, 1.25])
  })
})
