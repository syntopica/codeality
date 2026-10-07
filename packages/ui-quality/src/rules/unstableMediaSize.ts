import type { Rule } from '@/rules/Rule.js'

// An image or video in the flow whose box is unknown until its file
// arrives: no width and height attributes, no aspect-ratio, no CSS height.
// Everything below it jumps when it loads.
export const unstableMediaSize: Rule = (snapshot) =>
  snapshot.media
    .filter((media) => !media.sized)
    .map((media) => ({
      rule: 'unstable-media-size',
      severity: 'warn',
      message: `this ${media.tag} has no width and height attributes, aspect-ratio or CSS height, so the content below it shifts when it loads; give it its dimensions`,
      subject: media.selector,
      identity: media.signature,
    }))
