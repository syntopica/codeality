<p align="center"><img src="docs/assets/hero.png" width="100%" alt="codeality turns chaotic AI-generated code into small, clean files"></p>

<h1 align="center">codeality</h1>

<p align="center"><b>A++ clean code from your AI agents. Zero effort for you. Fewer tokens for them.</b></p>

<p align="center">
Your agent writes fast. codeality makes it write <i>clean</i>: one unit per file,
no hidden helpers, no inline types, duplication under 1%, no dead exports, no
import cycles - enforced by gates whose messages tell the agent what to fix.
You decide the rules once; the agent does the fixing.
</p>

<p align="center">
<a href="https://www.npmjs.com/package/eslint-plugin-code-policy"><img src="https://img.shields.io/npm/v/eslint-plugin-code-policy?label=code-policy" alt="eslint-plugin-code-policy on npm"></a>
<a href="https://pypi.org/project/syntopica-codeality-py/"><img src="https://img.shields.io/pypi/v/syntopica-codeality-py?label=python" alt="syntopica-codeality-py on PyPI"></a>
<a href="./LICENSE"><img src="https://img.shields.io/github/license/syntopica/codeality" alt="MIT license"></a>
</p>

```bash
pnpm dlx @syntopica/create-baseline --write   # add the missing gate config and scripts
pnpm dlx @syntopica/create-baseline --soft    # print the install line for what is missing
pnpm check:ci && pnpm check:quality           # then hand these two to your agent
```

Existing config files and script values are kept: `--write` adds the files that
are missing and adds missing scripts to `package.json`.

---

## The problem

AI agents ship code that works and drifts. Session after session they:

- pile a component, its hook, its types and three helpers into one 900-line
  file;
- copy a block that already exists two folders away;
- leave exports nobody imports;
- reach for `any` when a type gets in the way.

Each change is small and each one passes review, so the structure you agreed on
erodes without anyone deciding to give it up. In a measured chain of twenty
changes, an agent working without a gate grew the largest file by 400 lines and
added fifty new rule violations; with the gate, it added none.

## Before / after

<p align="center"><img src="docs/assets/before-after.png" width="100%" alt="Before: one giant file. After: small files with one job each"></p>

**Before** - what an agent produces left alone (`src/UserList.tsx`, one file):

```tsx
import { useEffect, useState } from 'react'

type User = { id: string; name: string; teamId: string }
type Team = { id: string; name: string }

function formatName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

export function UserList({ ids }: { ids: string[] }) {
  const [users, setUsers] = useState<(User & { team: Team })[]>([])
  useEffect(() => {
    ;(async () => {
      const out = []
      for (const id of ids) {
        const user = await fetch(`/api/users/${id}`).then((r) => r.json()) // N+1
        const team = await fetch(`/api/teams/${user.teamId}`).then((r) =>
          r.json(),
        )
        out.push({ ...user, team })
      }
      setUsers(out)
    })()
  }, [ids])
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>
          {formatName(u.name)} - {u.team.name}
        </li>
      ))}
    </ul>
  )
}

export const unusedLegacyHelper = () => {} // dead export
```

**What codeality tells the agent** - real ESLint output on that file, excerpt:

```text
src/UserList.tsx
   3:1   error    Inline types (interfaces or type aliases) are not permitted within runtime files. Please extract this type into its own dedicated file (e.g., UserProps.ts or UserState.ts) according to the Atomic File architecture  code-policy/no-inline-types-in-runtime-files
   6:1   error    Top-level declaration "formatName" is not exported. The Primary Unit Rule forbids hidden internal helpers or types at the module scope  code-policy/no-hidden-top-level-declarations
  12:3   warning  Strict View Separation: The hook "useEffect" is forbidden in a view component. Extract your state/effects to a separate useUserList hook  code-policy/view-logic-separation
  16:15  error    Unsafe assignment of an `any` value  @typescript-eslint/no-unsafe-assignment
  36:14  error    File contains multiple primary exported units (found 2). The Atomic File Rule requires exactly one primary exported unit  code-policy/one-primary-unit

✖ 19 problems (16 errors, 3 warnings)
```

Warnings fail too: the templates' `lint` script and the generated pre-commit
hook run ESLint with `--max-warnings 0`, and `create-baseline` flags a `lint`
script that allows any.

**After** - the same feature once the gate is green (0 problems):

```text
src/users/
  types/User.ts
  types/Team.ts
  types/UserWithTeam.ts
  types/UserListProps.ts
  services/fetchUsersWithTeams.ts
  hooks/useUserList.ts
  UserList.tsx
src/shared/formatters/formatName.ts
```

```tsx
import { formatName } from '../shared/formatters/formatName'
import type { UserListProps } from './types/UserListProps'

export function UserList({ users }: UserListProps) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          {formatName(user.name)} - {user.team.name}
        </li>
      ))}
    </ul>
  )
}
```

Small files with one job each. This shows the layout the rules produce, not a
saving: agents search and read line ranges, so splitting a file did not make
them read less (see the FAQ). Both versions are in
[`docs/examples/user-list`](./docs/examples/user-list) with the commands to
reproduce the lint result.

One honest note: the gates forced the split, not the batched request. Replacing
the N+1 loop with one `fetchUsersWithTeams` call was the agent's design choice.

## Why it works with agents

<p align="center"><img src="docs/assets/agent-loop.png" width="420" alt="The agent writes, the gates reject with a fix, the agent repairs until clean"></p>

- **Error messages are instructions.** The structural rules name the declaration
  and the kind of file it belongs in. The agent fixes it without asking you.
- **Gates, not guidelines.** A `CLAUDE.md` saying "write clean code" is a wish.
  A red required CI check is a fact the agent has to fix. Local hooks can be
  skipped and rules disabled, so make the CI job required and review changes to
  the rules and to the debt baselines.
- **Adopt on a messy repo today.** `lint:suppress` records existing ESLint
  errors so only new ones fail; see the
  [existing-repo guide](./docs/adoption/existing-repo.md) for warnings and the
  other gates.

## What you get, and what it costs

### Measured

- **The structure you chose holds.** Over twenty successive agent changes, the
  ungated code gained fifty violations and a 400-line larger file; the gated
  code gained none, whether the tree started strict or only new code had to
  comply.
- **It costs agent time.** Keeping the rules made the agent about a quarter more
  expensive over those twenty changes on an already strict tree, and two and a
  half times as expensive when the rules applied only to new code in a tree of
  god files. Correctness was the same either way.
- **No token saving.** Splitting code into small files did not make agents read
  less or make fewer mistakes. Unbundled Node code starts about 20% slower;
  bundled, it starts as fast as before.

All of it is in the
[measurement write-up](./docs/evidence/2026-10-12-agent-token-measurement.md).

### What each gate enforces

- **One exported unit per file** (`one-primary-unit`) and **no hidden
  module-level helpers** (`no-hidden-top-level-declarations`). A file with more
  than one exported unit fails; a class counts as one unit however many methods
  it has, so size caps (100 code lines per file) do the rest.
- **Predictable placement** (`file-kind-placement`): files named as hooks,
  formatters, validators, mappers or selectors must sit in the matching folder,
  and `utils/` or `helpers/` folders are rejected.
- **Types apart from runtime code** (`no-inline-types-in-runtime-files`).
- **Entry-point imports** (`public-api-imports`,
  `no-cross-module-deep-imports`): imports matching configured patterns, such as
  `/src/` or a deep relative path into another module, are rejected. These are
  pattern checks, not a resolved public API.
- **No import cycles or orphans** (dependency-cruiser).
- **Duplication under a threshold** (jscpd): clones of 70 tokens or more, with
  at most 1% of the code duplicated.
- **No dead code** (knip): unused files, exports and dependencies.
- **Strict TypeScript**: an API the agent invented fails the type check, not
  production.
- **Views without logic** (`view-logic-separation`): React hooks and handlers in
  a component are reported, so state and effects move into a hook.

Whether this layout makes human review faster or merge conflicts rarer has not
been measured. Adopt it because you want these conventions enforced, not for a
promised saving.

### Optional gates

- **Cheaper test suites** (test-quality): finds DOM environments booted for
  files that never touch the DOM, and files that two projects both run.
- **Eyes for the UI** (ui-quality): an agent cannot see the page it built. The
  gate renders your routes in light and dark at several widths and reports
  contrast, clipping, misaligned columns and off-palette colours.
- **Database checks** (db-quality): Supabase migrations and Prisma/Drizzle
  schemas linted before they reach production.
- **Checks at commit time** (lefthook): problems surface in seconds on the
  agent's machine, not minutes later in CI.

These do not depend on the structural rules; each can be adopted on its own.

## Give this to your agent

Paste this into `CLAUDE.md`, `AGENTS.md`, `.cursor/rules` or the start of a
task:

```text
Before you finish, run `pnpm check:ci` and `pnpm check:quality`. Fix every finding they report and run them again until both pass. If a finding needs a judgment call, follow the existing conventions of the repository and say what you decided.
```

It works with Claude Code, Cursor, Codex and any agent that can run a shell
command, because it relies on your repository's scripts rather than an
agent-specific integration.

## What gets checked

**Core** - wired by `create-baseline --write`:

| Package                      | Reports                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `eslint-plugin-code-policy`  | multiple exported units, hidden top-level helpers, inline types, misplaced files, deep imports, mixed barrels, view logic |
| `@syntopica/eslint-config`   | strict flat ESLint for Next.js, Astro, Vite React/Vue, Nuxt, Node                                                         |
| `@syntopica/quality-config`  | duplicated blocks (jscpd), unused files/exports/deps (knip), import graph violations (dependency-cruiser)                 |
| `@syntopica/tsconfig`        | strict TypeScript presets                                                                                                 |
| `@syntopica/prettier-config` | formatting, import order, Tailwind class order                                                                            |

**Optional** - each installed and configured on its own:

| Package                   | Reports                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `@syntopica/test-quality` | test-suite cost: unneeded DOM environments, files run twice, uncached lint in git hooks        |
| `@syntopica/ui-quality`   | rendered routes in light and dark: contrast, clipping, misaligned columns, off-palette colours |
| `@syntopica/db-quality`   | Supabase migrations, Prisma/Drizzle schemas, SQLite files, live Supabase project audit         |
| `syntopica-codeality-py`  | the same structural rules for Python, plus one aggregated gate                                 |
| `cargo-baseline`          | the same structural rules for Rust                                                             |

## Quick start

**Existing repo:**

```bash
pnpm dlx @syntopica/create-baseline --write
pnpm dlx @syntopica/create-baseline --soft    # run the install line it prints
pnpm check:ci
pnpm check:quality
```

Review what `--write` generated before committing: `deps:graph` is scoped to
`src`, and e2e specs or hand-run scripts need declaring as knip entry points.
Already have lint debt? Follow the
[existing-repo guide](./docs/adoption/existing-repo.md).

**New repo:** copy a template from [`templates/`](./templates) - Next.js, Astro,
Vite + React, Vue, Nuxt 4, NestJS, Tauri, TS package, Python package - then
`pnpm install && pnpm check:ci`.

**Python:**

```bash
uvx --from syntopica-codeality-py codeality-py gate --project .
```

## How it fits with your tools

codeality does not replace your linters; it composes them. Type safety comes
from typescript-eslint, duplication from jscpd, dead code from knip, the import
graph from dependency-cruiser, and smells from SonarJS. What codeality adds is
the structural rules (one unit per file, placement, entry-point patterns), one
maintained configuration of all of it, debt baselines, and `create-baseline`,
which checks that every gate is actually wired into CI. If your own ESLint,
Biome or knip setup already does what you need, keep it and take only the pieces
you are missing.

## FAQ

**Will it rewrite my code?** No. `--write` adds missing config files and adds
missing scripts to `package.json`; it does not create your ESLint, TypeScript or
Prettier setup. The fixing is done by you or your agent, one finding at a time.

**Are the token savings measured?** Yes, and the honest answer is "no savings".
Over 300 agent runs on three codebases, including hard tasks and a chain of
twenty successive changes scored by hidden tests written before the runs, the
strictly structured code was changed correctly just as often and cost the agent
about the same or more (up to a quarter more over the chain). Modern coding
agents search and read line ranges, so a god file costs them little. What the
gates did measurably do is hold the structure: over twenty changes the unguarded
code's largest file grew by 400 lines and gained fifty violations, the gated
code none. Ship a bundled build and the split code starts as fast as before.
Method and numbers:
[docs/evidence](./docs/evidence/2026-10-12-agent-token-measurement.md).

**Can I adopt one piece at a time?** Yes. Each public package can be adopted
separately, with the peers its README lists; start with the core and add the
optional gates when you need them.

**Does it work without an AI agent?** Yes. The gates do not know who wrote the
code.

## Docs

- [Engineering guide](./docs/engineering-guide.md) - the full standard
- [Quality gates](./docs/standards/quality-gates.md) - every gate, its
  threshold, how to handle a false positive
- Adoption: [new repo](./docs/adoption/new-repo.md),
  [existing repo](./docs/adoption/existing-repo.md),
  [migration](./docs/migration.md)
- [Platform decisions](./docs/platform-decisions.md)
- [Maintainers](./docs/maintainers.md) - publishing, CI pipeline, patches

---

If codeality caught something your agent would have shipped,
[give it a star](https://github.com/syntopica/codeality) - it helps other people
find it.

## License

[MIT](./LICENSE)
