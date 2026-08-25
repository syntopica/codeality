// Renovate defaults for a baseline project: the shared preset plus a
// release-age cooldown, so a compromised package has time to be caught before
// a bot opens the PR that installs it.
export function renovateConfig() {
  return `{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended", ":dependencyDashboard"],
  "minimumReleaseAge": "3 days"
}
`
}
