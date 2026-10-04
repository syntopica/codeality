import { describe, expect, it } from 'vitest'

import { passingFiles } from '@/measure/passingFiles.js'

const result = (name: string, status: string) => ({
  name,
  status,
  startTime: 0,
  endTime: 1,
})

describe('passingFiles', () => {
  // The fixture suite's rerun: a file two projects run comes back twice.
  it('counts a file once, and only when it passed everywhere', () => {
    expect(
      passingFiles({
        testResults: [
          result('/a', 'passed'),
          result('/a', 'passed'),
          result('/b', 'passed'),
          result('/b', 'failed'),
        ],
      }),
    ).toEqual(['/a'])
  })
  it('is empty without a report', () => {
    expect(passingFiles(null)).toEqual([])
  })
})
