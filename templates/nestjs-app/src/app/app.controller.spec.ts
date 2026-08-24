import { describe, expect, it } from 'vitest'

import { AppController } from './app.controller'
import { AppService } from './app.service'

describe('AppController', () => {
  it('delegates the greeting to the service', () => {
    const controller = new AppController(new AppService())

    expect(controller.getHello()).toContain('NestJS')
  })
})
