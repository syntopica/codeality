# Agent token use before and after adopting the structural rules

Date: 2026-10-12. Question: does a codebase that follows codeality's structural
rules (one unit per file, placement, no inline types) cost an AI agent fewer
tokens per task?

## Subject

A private TypeScript CLI (job-posting aggregator), measured at the commit
immediately before it adopted the strict baseline and at the adoption commit
itself. The adoption commit is a pure restructuring: same behaviour, same tests.

Non-test source under `src/`, blank lines excluded:

|                                                          | before | after |
| -------------------------------------------------------- | -----: | ----: |
| files                                                    |     60 |   250 |
| code lines                                               |   2522 |  3563 |
| mean lines per file                                      |     42 |    14 |
| median lines per file                                    |     30 |    11 |
| largest file                                             |    174 |    64 |
| avg size of the file holding a function (approx. tokens) |    684 |   197 |

The "before" tree was already moderately structured (no file over 174 lines). It
is not a god-file codebase.

## Method

Claude Code 2.1.296, `claude -p --model sonnet`, project settings only, no MCP
servers, `Agent`, `Bash`, `WebSearch` and `WebFetch` disabled, a fresh copy of
the tree per run. Three tasks, three runs per task per tree, 18 runs in total:

- **t1** - explain every eligibility check and the file implementing it.
- **t2** - explain how postings are grouped as the same role.
- **t3** - edit: show 3 locations instead of 4, add Portugal to the prioritised
  regions, update the tests. All six runs made the change correctly.

Tokens are input + cache creation + cache read, summed over the session, as
reported by `--output-format json`.

## Results

Median total tokens per run:

| task | before |  after | after / before | mean turns before / after | mean cost before / after |
| ---- | -----: | -----: | -------------: | ------------------------: | -----------------------: |
| t1   | 104099 | 104253 |           1.00 |                   10 / 18 |          $0.102 / $0.116 |
| t2   |  72356 |  94687 |           1.31 |                    8 / 11 |          $0.079 / $0.083 |
| t3   |  86624 | 146880 |           1.70 |                   11 / 18 |          $0.111 / $0.129 |

In t3 the agent changed 2 files in the "before" tree and 4-5 in the "after"
tree, because the threshold and the region list had become separate files.

## Reading

On this codebase the atomic layout did **not** reduce token use. Each file the
agent opens is smaller, but it opens more of them, and every extra turn re-sends
the conversation so far. Prompt caching keeps the cost difference (+3% to +16%)
far smaller than the token difference.

What this does not show: a "before" made of large multi-responsibility files,
where reading one unit forces reading hundreds of unrelated lines. That is the
case the token argument was made for, and it needs its own measurement before
the claim is made or dropped.

## Second subject: a public repository with a god file

[khromov/ai-digest](https://github.com/khromov/ai-digest) (MIT, commit
`0dfe6ba`), whose `src/digest.ts` is 1039 lines. Before: 39 `code-policy`
violations. Codex restructured a copy to zero violations as a mechanical move,
with no test, config or package file touched; it was then verified
independently: `tsc --noEmit` clean, 50 of 50 jest tests passing.

|                                                          | before | after |
| -------------------------------------------------------- | -----: | ----: |
| source files                                             |      4 |    47 |
| code lines                                               |   1380 |  1451 |
| largest file                                             |    919 |   270 |
| avg size of the file holding a function (approx. tokens) |   3647 |   431 |

Same method as above, with the repository's own `CLAUDE.md` removed from both
trees. Tasks: t1 explain which files are included or skipped and where; t2
explain the Claude and OpenAI token estimate; t3 edit the 10MB limit to 20MB and
the binary-file placeholder text, updating tests. All six edit runs were
correct.

| task | before | after | after / before | mean turns before / after | mean cost before / after |
| ---- | -----: | ----: | -------------: | ------------------------: | -----------------------: |
| t1   |  63225 | 83166 |           1.32 |                  5 / 13.7 |          $0.120 / $0.112 |
| t2   |  67622 | 65476 |           0.97 |                 6.3 / 8.0 |          $0.065 / $0.063 |
| t3   |  81139 | 65039 |           0.80 |                10.7 / 8.7 |          $0.069 / $0.063 |

Across the three tasks the mean cost fell 6% (from $0.254 to $0.238), while
total tokens rose on the explanation task. Reading a 919-line file once is cheap
in turns but expensive to cache; reading many small files costs more turns, each
one mostly cheap cache reads.

## Third subject: a god file inside a larger repository

[kbwo/ccmanager](https://github.com/kbwo/ccmanager) (MIT, commit `46fe720`),
about 20,000 lines of TypeScript. Only its largest file was restructured, the
way a team adopting the rules on a messy repository would start:
`src/services/worktreeService.ts`, a 1546-line class. Codex turned it into a
123-line facade plus 32 files under `src/services/worktree/` (largest 98 lines),
judged by `code-policy` plus `max-lines` 100; verified independently: judge,
`tsc --noEmit` and the project's own ESLint all clean, 1042 of 1042 vitest tests
passing, no file outside that scope touched.

Note: `code-policy` alone reported only 10 problems on the 1546-line file,
because a class counts as one unit. `max-lines`, which
`@syntopica/eslint-config` sets to 100, is what flags a god class.

Tasks, all about worktrees: t1 explain how a worktree is created; t2 explain how
its base branch is resolved; t3 edit the session-data copy to skip with a
warning instead of throwing. All six edit runs were correct.

| task | before |  after | after / before | mean turns before / after | mean cost before / after |
| ---- | -----: | -----: | -------------: | ------------------------: | -----------------------: |
| t1   |  91843 |  98031 |           1.07 |                8.3 / 12.0 |          $0.100 / $0.102 |
| t2   | 126624 | 126223 |           1.00 |               10.0 / 11.7 |          $0.137 / $0.118 |
| t3   | 165725 | 161937 |           0.98 |               11.0 / 10.3 |          $0.101 / $0.089 |

Mean cost of the three tasks fell 9% (from $0.338 to $0.308); tokens were flat.

## Fourth subject: the whole of ccmanager, refactored strictly

The same commit `46fe720`, this time with every source file brought under the
rules, as a team would after adopting codeality in full. Claude (Opus) did the
refactor in six waves against a strict judge: `code-policy` recommended plus
`view-logic-separation`, `max-lines` 100, `max-lines-per-function` 50,
`complexity` 10, `max-depth` 4 and `max-params` 4, all as errors, tests
excluded. After every wave `tsc --noEmit` and the project's own ESLint were
clean and 1042 of 1042 vitest tests passed.

Judge errors went from 993 to 18. The 18 left are forced by keeping behaviour
and tests unchanged: 15 `src/utils/*` files kept as facades because the tests
import and mock those paths, and 3 public method signatures with 5-6 parameters.

|                     | before | after |
| ------------------- | -----: | ----: |
| source files        |     92 |  1342 |
| code lines          |  18303 | 26311 |
| largest file, lines |   1449 |   175 |

Five tasks, five runs per task per tree, 50 runs in total:

- **t1** - explain every step of creating a worktree, with its file.
- **t2** - explain how a session is detected as busy, waiting or idle.
- **t3** - explain how the main menu builds its items, numbering and groups.
- **t4** - edit: skip the session-data copy with a warning instead of throwing
  when the Claude projects directory is missing, updating tests.
- **t5** - edit: rename the "New Worktree" menu entry to "Create Worktree" and
  raise the name generator timeout from 30 to 45 seconds, updating tests.

All 20 edit runs were correct, checked by diffing each run against its tree.

| task | before |  after | after / before | mean turns before / after | mean cost before / after |
| ---- | -----: | -----: | -------------: | ------------------------: | -----------------------: |
| t1   |  98627 |  98400 |           1.00 |                8.8 / 15.4 |          $0.099 / $0.112 |
| t2   |  96403 |  95319 |           0.99 |                9.0 / 12.0 |          $0.091 / $0.090 |
| t3   |  88688 |  96746 |           1.09 |                6.0 / 14.8 |          $0.113 / $0.101 |
| t4   | 173862 | 171104 |           0.98 |               11.6 / 11.0 |          $0.110 / $0.094 |
| t5   |  76566 | 101483 |           1.33 |                 9.0 / 8.6 |          $0.063 / $0.075 |

Mean cost of the five tasks: $0.476 before, $0.472 after (-1%). Spread within a
cell is large: t1 before ranged from 79k to 180k tokens across its five runs.

## Runtime cost of the same refactor

The structural rules split code into more files; they do not make a module
import less of the code it reaches. Measured on both ccmanager trees, Node
26.11.1, Bun's `--compile` build as ccmanager ships it, timings interleaved over
40 rounds on a loaded machine:

|                                               |           before |            after |
| --------------------------------------------- | ---------------: | ---------------: |
| own modules loaded by `cli.js --version`      |        86 of ~92 |     968 of ~1342 |
| bundle, minified (gzip)                       | 1424 KB (429 KB) | 1478 KB (444 KB) |
| compiled binary                               |          72.3 MB |          72.3 MB |
| startup, `node dist/cli.js --version`, median |           366 ms |           442 ms |
| startup, compiled binary `--version`, median  |            58 ms |            60 ms |
| `tsc` build                                   |            3.5 s |            7.0 s |

Unbundled, many small files start 21% slower (a first run on a busier machine
gave 32%): Node resolves and loads each file separately. Bundled, as the shipped
binary is, the difference is 3% in size and time. Loading only what a command
needs takes lazy `import()` at the entry point, which no structural rule asks
for.

## Conclusion across the four subjects

| subject               | starting point               | tokens, edit tasks | cost, all tasks |
| --------------------- | ---------------------------- | -----------------: | --------------: |
| private CLI           | already tidy (max 174 lines) |               +70% |            +12% |
| ai-digest             | 1039-line god file           |               -20% |             -6% |
| ccmanager, one file   | 1546-line god class          |                -2% |             -9% |
| ccmanager, whole repo | 18k lines, max 1449 lines    |       -2% and +33% |             -1% |

"Fewer tokens" is not a claim these measurements support: token counts moved in
both directions. The 6-9% cost reduction seen with three runs per cell did not
hold up on the largest test, five runs per cell over the whole repository, which
came out flat. What the rules buy an agent here is not a cheaper session but the
same cost on code that is smaller per file, typed, deduplicated and gated; nor
do they make the program faster, and unbundled they make it start slower.

Raw per-run JSON was kept in the session scratchpad, not committed.
