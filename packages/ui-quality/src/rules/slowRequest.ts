import type { Rule } from '@/rules/Rule.js'

// A screen that waits on a slow request shows an empty table or a spinner
// first, and a capture taken then passes every other rule: on InteliFactu a
// 2.5s report query was measured as a clean, empty page. A GET that answered
// fast when timed again was slowed by the machine, not the app.
export const slowRequest: Rule = (snapshot, { options }) =>
  snapshot.requests
    .filter(
      (request) =>
        request.durationMs > options.slowRequest.maxMs &&
        (request.retimedMs ?? Infinity) > options.slowRequest.maxMs,
    )
    .map((request) => {
      const name = `${request.method} ${request.path}${request.action ? ` (server action ${request.action.slice(0, 12)})` : ''}`
      return {
        rule: 'slow-request',
        severity: 'warn',
        message: `${name} took ${String(request.durationMs)}ms while the page loaded${request.retimedMs === undefined ? '' : ` and ${String(request.retimedMs)}ms again`}, over ${String(options.slowRequest.maxMs)}ms; the screen waits on it to show its data`,
        subject: name,
        identity: name,
      }
    })
