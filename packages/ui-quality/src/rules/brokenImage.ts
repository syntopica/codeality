import type { RawFinding } from '@/model/RawFinding.js'
import type { Rule } from '@/rules/Rule.js'

// An image that finished loading with no pixels, one with no source at all,
// or a video the browser could not play: the page shows a hole or an icon.
// A CSS background image whose request failed or answered 400 and up leaves
// its box bare in the same way.
export const brokenImage: Rule = (snapshot) => {
  const failed = new Set(snapshot.failedImages)
  const media: RawFinding[] = snapshot.media
    .filter((box) => box.broken)
    .map((box) => ({
      rule: 'broken-image',
      severity: 'warn',
      message: `this ${box.tag} did not load, or has no source; fix its address or remove it`,
      subject: box.selector,
      identity: box.signature,
    }))
  const backgrounds: RawFinding[] = snapshot.backgroundImages
    .filter((background) => failed.has(background.url))
    .map((background) => ({
      rule: 'broken-image',
      severity: 'warn',
      message: `the CSS background image ${background.url.split('/').pop() ?? background.url} did not load; fix its address or remove it`,
      subject: background.selector,
      identity: `background:${background.signature}`,
    }))
  return [...media, ...backgrounds]
}
