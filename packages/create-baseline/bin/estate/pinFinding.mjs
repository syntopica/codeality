/**
 * A finding for a tool pinned to something other than the current release:
 * `dart-pin-not-released` style when `pinned` is not a version, otherwise
 * `-pin-outdated`.
 */
export function pinFinding(prefix, tool, pinned, current) {
  if (pinned === current) return []
  if (!/^\d+\.\d+\.\d+$/.test(pinned ?? '')) {
    return [
      {
        id: `${prefix}-pin-not-released`,
        level: 'error',
        message: `${tool} is pinned to ${pinned ?? 'a source'}, not a release`,
        detail: `Pin the released ${current} once it is published.`,
      },
    ]
  }
  return [
    {
      id: `${prefix}-pin-outdated`,
      level: 'error',
      message: `${tool} is pinned to ${pinned}, current is ${current}`,
      detail: 'Re-run init, or bump the pin by hand.',
    },
  ]
}
