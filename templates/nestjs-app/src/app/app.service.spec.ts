import { describe, expect, it } from 'vitest'

import { AppService } from './app.service'

describe('AppService', () => {
  it('returns the greeting', () => {
    const service = new AppService()

    expect(service.getHello()).toContain('NestJS')
  })
})
