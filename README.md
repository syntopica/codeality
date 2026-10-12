<!-- HERO IMAGE: docs/assets/hero.png (prompt in docs/marketing/image-prompts.md) -->

<h1 align="center">codeality</h1>

<p align="center"><b>A++ clean code from your AI agents. Zero effort. Fewer tokens.</b></p>

<p align="center">
Your agent writes fast. codeality makes it write <i>clean</i>: one unit per file,
no duplicates, no dead code, no import cycles, no slow tests, no ugly UI -
enforced by gates whose error messages tell the agent exactly how to fix them.
</p>

<p align="center">
<a href="https://www.npmjs.com/package/eslint-plugin-code-policy"><img src="https://img.shields.io/npm/v/eslint-plugin-code-policy?label=code-policy" alt="npm"></a>
<a href="https://pypi.org/project/syntopica-codeality-py/"><img src="https://img.shields.io/pypi/v/syntopica-codeality-py?label=python" alt="PyPI"></a>
<a href="./LICENSE"><img src="https://img.shields.io/github/license/syntopica/codeality" alt="license"></a>
</p>

```bash
pnpm dlx @syntopica/create-baseline --write
```

One command wires the gates into an existing repo. Nothing you already have is
overwritten. Then let your agent run `pnpm check:all` until it is green.

---

## The problem

AI agents ship code that works and rots. Every session they:

- pile a component, its hook, its types and three helpers into one 900-line
  file;
- copy a utility that already exists two folders away;
- leave exports nobody imports;
- fetch inside a loop, then write a test suite that boots a DOM to test a pure
  function.

The next session has to read all of it to change one line. That is where your
tokens go.

## Before / after

<!-- BEFORE/AFTER IMAGE: docs/assets/before-after.png -->

**Before** - what an agent produces left alone (`src/UserList.tsx`, one file):

```tsx
import { useEffect, useState } from 'react'

type User = { id: string; name: string; teamId: string }
type Team = { id: string; name: string }

function formatName(name: string) {
  // the same helper also lives in src/admin/utils.ts
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

**What codeality tells the agent:**

```text
src/UserList.tsx
  error  File contains multiple top-level declarations (found 5). Extract them
         into separate files to enforce atomic file structure.      code-policy/atomic-file
  error  Strict View Separation: The hook "useEffect" is forbidden in a view
         component. Extract your state/effects to a separate useUserList hook.
                                                                     code-policy/view-logic-separation
knip     Unused export: unusedLegacyHelper
jscpd    Clone found: src/UserList.tsx:6-9 <-> src/admin/utils.ts:12-15
```

**After** - what the agent produces once the gate is green:

```text
src/users/
  User.ts                 type only
  UserWithTeam.ts         type only
  fetchUsersWithTeams.ts  one batched request, no loop
  useUserList.ts          state and effects
  UserList.tsx            pure view
src/shared/formatName.ts  the one copy, imported by both callers
```

```tsx
import type { UserWithTeam } from './UserWithTeam'
import { formatName } from '../shared/formatName'

export function UserList({ users }: { users: UserWithTeam[] }) {
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
```

Small files with one job each. The next agent opens the 15-line file it needs
instead of the 900-line one, so it reads less, spends fewer tokens and breaks
less.

## Why it works with agents

- **Error messages are instructions.** Every rule says what to extract and where
  it goes. The agent fixes it without asking you.
- **Gates, not guidelines.** A `CLAUDE.md` saying "write clean code" is a wish.
  A red `check:all` is a fact the agent cannot talk its way around.
- **One unit per file** is the cheapest context an agent can get: the file name
  is the index, `grep` finds it, and a change touches one small file.
- **Debt is carried, not ignored.** Adopt on a messy repo today; existing
  findings go into a baseline and only new ones fail.

## What gets checked

| Gate                         | Catches                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| `eslint-plugin-code-policy`  | god files, inline types, mixed barrels, deep cross-module imports, hooks inside views       |
| `@syntopica/quality-config`  | duplicated code (jscpd), dead files/exports/deps (knip), import cycles (dependency-cruiser) |
| `@syntopica/test-quality`    | slow suites: DOM environments for DOM-free tests, files run twice, hooks repeating a gate   |
| `@syntopica/ui-quality`      | rendered UI in light and dark: contrast, clipping, misaligned columns, off-palette colours  |
| `@syntopica/db-quality`      | Supabase migrations, Prisma/Drizzle schemas, live Supabase project audit                    |
| `@syntopica/eslint-config`   | strict flat ESLint for Next.js, Astro, Vite React/Vue, Nuxt, Node                           |
| `@syntopica/tsconfig`        | strict TypeScript presets                                                                   |
| `@syntopica/prettier-config` | formatting, import order, Tailwind class order                                              |
| `syntopica-codeality-py`     | the same structural rules for Python, plus one aggregated gate                              |
| `cargo-baseline`             | the same structural rules for Rust                                                          |

## Quick start

**Existing repo:**

```bash
pnpm dlx @syntopica/create-baseline --write   # wire knip, lefthook, renovate, dependency-cruiser
pnpm dlx @syntopica/create-baseline --soft    # print the install line for what is missing
pnpm check:all
```

**New repo:** copy a template from [`templates/`](./templates) - Next.js, Astro,
Vite + React, Vue, Nuxt 4, NestJS, Tauri, TS package, Python package - then
`pnpm install && pnpm check:all`.

**Python:**

```bash
uvx --from syntopica-codeality-py codeality-py gate --project .
```

Then tell your agent once: _"Run `pnpm check:all` and fix everything it reports
before you finish."_ That is the whole workflow.

## Docs

- [Engineering guide](./docs/engineering-guide.md) - the full standard
- [Quality gates](./docs/standards/quality-gates.md) - every gate, its
  threshold, how to handle a false positive
- Adoption: [new repo](./docs/adoption/new-repo.md),
  [existing repo](./docs/adoption/existing-repo.md),
  [migration](./docs/migration.md)
- [Platform decisions](./docs/platform-decisions.md)
- [Maintainers](./docs/maintainers.md) - publishing, CI pipeline, patches

## License

[MIT](./LICENSE)
