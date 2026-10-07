import type { Rule } from '@/rules/Rule.js'

// An image that finished loading with no pixels, one with no source at all,
// or a video the browser could not play: the page shows a hole or an icon.
export const brokenImage: Rule = (snapshot) =>
  snapshot.media
    .filter((media) => media.broken)
    .map((media) => ({
      rule: 'broken-image',
      severity: 'warn',
      message: `this ${media.tag} did not load, or has no source; fix its address or remove it`,
      subject: media.selector,
      identity: media.signature,
    }))
