<p align="center"><img src="docs/assets/hero.png" width="100%" alt="codeality turns chaotic AI-generated code into small, clean files"></p>

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

<p align="center"><img src="docs/assets/before-after.png" width="100%" alt="Before: one giant file, N+1 requests, tokens drained. After: small files, one request, tokens saved"></p>

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

**What codeality tells the agent** (real `eslint` output on that file, excerpt):

```text
src/UserList.tsx
   3:1   error    Inline types (interfaces or type aliases) are not permitted within runtime files. Please extract this type into its own dedicated file (e.g., UserProps.ts or UserState.ts) according to the Atomic File architecture  code-policy/no-inline-types-in-runtime-files
   6:1   error    Top-level declaration "formatName" is not exported. The Primary Unit Rule forbids hidden internal helpers or types at the module scope  code-policy/no-hidden-top-level-declarations
  13:3   warning  Strict View Separation: The hook "useEffect" is forbidden in a view component. Extract your state/effects to a separate useUserList hook  code-policy/view-logic-separation
  17:15  error    Unsafe assignment of an `any` value  @typescript-eslint/no-unsafe-assignment
  37:14  error    File contains multiple primary exported units (found 2). The Atomic File Rule requires exactly one primary exported unit  code-policy/one-primary-unit

✖ 19 problems (16 errors, 3 warnings)
```

On top of that, knip flags `unusedLegacyHelper` as an unused export and jscpd
flags `formatName` as a clone of the copy in `src/admin/utils.ts`.

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

<p align="center"><img src="docs/assets/agent-loop.png" width="420" alt="The agent writes, the gates reject with a fix, the agent repairs until clean"></p>

- **Error messages are instructions.** Every rule says what to extract and where
  it goes. The agent fixes it without asking you.
- **Gates, not guidelines.** A `CLAUDE.md` saying "write clean code" is a wish.
  A red `check:all` is a fact the agent cannot talk its way around.
- **Debt is carried, not ignored.** Adopt on a messy repo today; existing
  findings go into a baseline and only new ones fail.

## What strict rules buy you

Every rule here costs the agent a few seconds once and pays back on every
session after it.

### Less context, fewer tokens

- **Atomic files** (one exported unit per file) mean the agent loads the 20
  lines it needs, not the 900 around them. Reading is most of what an agent
  spends.
- **The file name is the index.** `useUserList.ts` holds `useUserList`. The
  agent finds code with `ls` and `grep` instead of reading files to discover
  what is in them.
- **Predictable placement** (`file-kind-placement`): hooks, types, views and
  services each have a home. The agent knows where code lives and where new code
  goes, so there is no `utils.ts` dumping ground to scan.
- **No dead code** (knip): nothing unused for the agent to read, keep in sync,
  or copy as an example.

### Smaller blast radius, fewer broken edits

- **A change touches one small file.** Fewer lines in play means fewer
  accidental edits to code next door, and search-and-replace edits match exactly
  once.
- **Public entry points only** (`public-api-imports`,
  `no-cross-module-deep-imports`): callers depend on a module's front door, so
  the agent can rewrite its internals without breaking anything outside.
- **No import cycles** (dependency-cruiser): each module can be understood and
  changed on its own, and load-order bugs disappear.
- **One copy of everything** (jscpd): a bug fixed once is fixed everywhere. No
  more agent patching one copy and missing the other two.
- **Types in their own files**: one definition reused across the codebase,
  instead of a slightly different `User` redefined in every file that needs one.
- **Strict TypeScript**: an API the agent invented fails the type check, not
  production.

### Easier to review, safe to parallelize

- **Small diffs.** A pull request made of 30-line files reads in minutes; one
  that rewrites half of a 900-line file does not.
- **Fewer merge conflicts.** Several agents or worktrees working at once rarely
  touch the same small file.
- **Views without logic** (`view-logic-separation`): components only render, so
  logic lives in hooks you test without a DOM, and markup changes never break
  behaviour.

### Faster loops, better product

- **Fast tests** (test-quality): no DOM booted for pure functions, no file run
  twice. The agent's check-fix loop gets shorter.
- **Eyes for the UI** (ui-quality): an agent cannot see the page it built. The
  gate renders it in light and dark at several widths and reports contrast,
  clipping and off-palette colours.
- **Sound database** (db-quality): migrations and schemas linted before they
  reach production.
- **Checks at commit time** (lefthook): problems surface in seconds on the
  agent's machine, not ten minutes later in CI.

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
