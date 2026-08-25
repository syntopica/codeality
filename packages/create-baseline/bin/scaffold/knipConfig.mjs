// A knip config that defers to the shared preset. A project with entry points
// the preset cannot know about - hand-run scripts, e2e specs - extends this
// afterwards; starting from one line makes that diff readable.
export function knipConfig(framework) {
  return `import { createKnipConfig } from '@busirocket/quality-config/knip'

export default createKnipConfig({ framework: '${framework}' })
`
}
