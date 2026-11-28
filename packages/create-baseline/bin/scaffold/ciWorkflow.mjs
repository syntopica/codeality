import { ACTION_PINS } from './actionPins.mjs'

// The gitleaks release the security job installs. Pinned to a fixed version
// rather than a floating tag, and verified against the release's own checksum
// manifest so a swapped asset fails the step instead of scanning with an
// unknown binary.
//
// The official gitleaks-action is not used: it requires GITLEAKS_LICENSE for
// organization-owned repositories with no public-repo exemption, and aborts
// before scanning anything without one. The CLI itself is MIT, and running it
// directly means CI runs the exact command local `secrets:check` runs, so the
// two cannot drift.
const GITLEAKS_VERSION = '8.30.1'

// The tadu release the backlog job installs, pinned for the same reason as
// gitleaks. pipx is preinstalled on ubuntu-latest, so no action is needed.
const TADU_VERSION = '0.2.0'

// Conditions every gate job on the change not being backlog-only.
const CODE_ONLY = `    needs: changes
    if: needs.changes.outputs.code == 'true'
`

const changesJob = () => `  changes:
    name: Classify the change
    runs-on: ubuntu-latest
    timeout-minutes: 5
    outputs:
      code: \${{ steps.classify.outputs.code }}
      backlog: \${{ steps.classify.outputs.backlog }}
    steps:
      - uses: ${ACTION_PINS.checkout.uses} # ${ACTION_PINS.checkout.tag}
        with:
          fetch-depth: 0
          persist-credentials: false

      # A change that touches only the tadu backlog skips the gates and runs
      # tadu doctor instead. A job skipped by \`if\` reports success, so a
      # required check stays satisfied, which \`paths-ignore\` would not do.
      - name: Classify the changed paths
        id: classify
        env:
          BASE: \${{ github.event.pull_request.base.sha || github.event.before }}
        run: |
          backlog=(todo TODO.md TODO_LOG.md TODO_HISTORY_INDEX.jsonl)
          outside=(.)
          for path in "\${backlog[@]}"; do outside+=(":(exclude)$path"); done
          code=true
          touched=true
          # No usable base (a new branch, or history GitHub did not send): run everything.
          if [ -n "\${BASE//0/}" ] && git cat-file -e "$BASE^{commit}" 2>/dev/null; then
            git diff --quiet --no-renames "$BASE" HEAD -- "\${outside[@]}" && code=false
            git diff --quiet --no-renames "$BASE" HEAD -- "\${backlog[@]}" && touched=false
          fi
          echo "code=$code" >> "$GITHUB_OUTPUT"
          echo "backlog=$touched" >> "$GITHUB_OUTPUT"

  backlog:
    name: tadu doctor
    needs: changes
    if: needs.changes.outputs.backlog == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: ${ACTION_PINS.checkout.uses} # ${ACTION_PINS.checkout.tag}
        with:
          persist-credentials: false

      - run: pipx run --spec tadu==${TADU_VERSION} tadu doctor .

`

const setup = (
  node,
) => `      - uses: ${ACTION_PINS.checkout.uses} # ${ACTION_PINS.checkout.tag}
        with:
          persist-credentials: false

      - uses: ${ACTION_PINS.setupPnpm.uses} # ${ACTION_PINS.setupPnpm.tag}

      - uses: ${ACTION_PINS.setupNode.uses} # ${ACTION_PINS.setupNode.tag}
        with:
          node-version: ${node}
          cache: pnpm

      - run: pnpm install --frozen-lockfile`

const buildJob = (node, tadu) => `

  build:
    name: Production build
    runs-on: ubuntu-latest
    timeout-minutes: 20
${tadu ? "    needs: [changes, verify]\n    if: needs.changes.outputs.code == 'true'\n" : '    needs: verify\n'}    steps:
${setup(node)}

      - run: pnpm run build`

/**
 * The CI workflow every baseline project runs.
 *
 * With `tadu`, a change that touches only the backlog skips the gates and runs
 * `tadu doctor` instead.
 *
 * Four jobs rather than one script: `verify` and `quality` are independent, so
 * running them in parallel keeps both inside a sane timeout on a repo where
 * typed linting alone takes minutes. Locally the same gates run as one command
 * each - `check:ci`, `check:quality`, `check:security` - so a developer never
 * has to reproduce the job layout to reproduce a failure.
 *
 * Without this file the gates are installed and unreachable: lefthook's
 * pre-commit only lints staged files and its pre-push only scans for secrets,
 * so type-check, tests, knip, jscpd, dependency-cruiser and type-coverage have
 * no automatic trigger at all.
 */
export function ciWorkflow({ node = 22, hasBuild = false, tadu = false } = {}) {
  const gate = tadu ? CODE_ONLY : ''
  return `# Written by \`create-baseline --write\`. Four jobs, three commands:
# \`check:ci\`, \`check:quality\` and \`check:security\` are the same entrypoints
# you run locally, so a red job reproduces with one line.
#
# Every action is pinned to a commit SHA, not a tag. A tag can be moved by
# whoever owns the action; a SHA cannot. The trailing comment names the tag the
# SHA came from so Renovate can still offer the upgrade.
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
${tadu ? changesJob() : ''}  verify:
    name: type-check + lint + format + test + dupes + knip
    runs-on: ubuntu-latest
    timeout-minutes: 30
${gate}    steps:
${setup(node)}

      - name: check:ci
        run: pnpm run check:ci

  quality:
    name: dependency graph + type coverage
    runs-on: ubuntu-latest
    timeout-minutes: 20
${gate}    steps:
${setup(node)}

      - name: check:quality
        run: pnpm run check:quality

  security:
    name: secrets + advisories + workflows
    runs-on: ubuntu-latest
    timeout-minutes: 15
${gate}    steps:
      # Full history: gitleaks cannot see a secret committed three commits ago
      # from a shallow clone.
      - uses: ${ACTION_PINS.checkout.uses} # ${ACTION_PINS.checkout.tag}
        with:
          fetch-depth: 0
          persist-credentials: false

      - uses: ${ACTION_PINS.setupPnpm.uses} # ${ACTION_PINS.setupPnpm.tag}

      - uses: ${ACTION_PINS.setupNode.uses} # ${ACTION_PINS.setupNode.tag}
        with:
          node-version: ${node}
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Install gitleaks
        env:
          GITLEAKS_VERSION: '${GITLEAKS_VERSION}'
        run: |
          curl -sSfLO "https://github.com/gitleaks/gitleaks/releases/download/v\${GITLEAKS_VERSION}/gitleaks_\${GITLEAKS_VERSION}_linux_x64.tar.gz"
          curl -sSfLO "https://github.com/gitleaks/gitleaks/releases/download/v\${GITLEAKS_VERSION}/gitleaks_\${GITLEAKS_VERSION}_checksums.txt"
          sha256sum --ignore-missing -c "gitleaks_\${GITLEAKS_VERSION}_checksums.txt"
          tar -xzf "gitleaks_\${GITLEAKS_VERSION}_linux_x64.tar.gz" gitleaks
          sudo install -m 0755 gitleaks /usr/local/bin/gitleaks
          gitleaks version

      - name: check:security
        run: pnpm run check:security

      # actionlint checks workflow syntax; zizmor checks workflow security -
      # template injection through \`\${{ github.event.* }}\`, unpinned actions,
      # over-broad GITHUB_TOKEN permissions, dangerous triggers. Neither
      # subsumes the other.
      - name: Workflow lint
        uses: ${ACTION_PINS.actionlint.uses} # ${ACTION_PINS.actionlint.tag}

      - name: Workflow security
        uses: ${ACTION_PINS.zizmor.uses} # ${ACTION_PINS.zizmor.tag}
        with:
          advanced-security: false${hasBuild ? buildJob(node, tadu) : ''}
`
}
