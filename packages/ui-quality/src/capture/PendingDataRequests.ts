import type { Page, Request } from 'playwright'

import { DATA_RESOURCE_TYPES } from '@/capture/DATA_RESOURCE_TYPES.js'

/**
 * The data requests that started after this was opened and have not ended:
 * what one interaction is still waiting for. A request that was already open
 * belongs to something else and is not counted.
 */
export class PendingDataRequests {
  private readonly requests = new Set<Request>()

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    page.on('request', this.remember)
    page.on('requestfinished', this.forget)
    page.on('requestfailed', this.forget)
  }

  get size(): number {
    return this.requests.size
  }

  private readonly remember = (request: Request): void => {
    if (DATA_RESOURCE_TYPES.has(request.resourceType()))
      this.requests.add(request)
  }

  private readonly forget = (request: Request): void => {
    this.requests.delete(request)
  }

  dispose(): void {
    this.page.off('request', this.remember)
    this.page.off('requestfinished', this.forget)
    this.page.off('requestfailed', this.forget)
  }
}
