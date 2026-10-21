import type { Page, Request } from 'playwright'

/** Track outstanding main-frame document requests during one route opening. */
export class PendingDocumentNavigations {
  readonly requests = new Set<Request>()

  failed = false

  private latest: Request | null = null

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
    page.on('request', this.remember)
    page.on('requestfinished', this.finish)
    page.on('requestfailed', this.fail)
  }

  private readonly remember = (request: Request): void => {
    if (
      request.isNavigationRequest() &&
      request.frame() === this.page.mainFrame()
    ) {
      this.latest = request
      this.failed = false
      this.requests.add(request)
    }
  }

  private readonly finish = (request: Request): void => {
    this.requests.delete(request)
  }

  private readonly fail = (request: Request): void => {
    this.requests.delete(request)
    if (request === this.latest) this.failed = true
  }

  dispose(): void {
    this.page.off('request', this.remember)
    this.page.off('requestfinished', this.finish)
    this.page.off('requestfailed', this.fail)
  }
}
