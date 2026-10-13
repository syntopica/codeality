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

The machine above ran a load average of 40-114 from other work, so the startup
timings were repeated on an otherwise idle Apple M1 laptop (load 3-7, Node
26.5.0, 40 interleaved rounds, the same builds):

|                                               | before |  after |
| --------------------------------------------- | -----: | -----: |
| startup, `node dist/cli.js --version`, median | 359 ms | 443 ms |
| startup, compiled binary `--version`, median  |  65 ms |  68 ms |

Unbundled, many small files start 21-23% slower: Node resolves and loads each
file separately. Bundled, as the shipped binary is, the difference is 3% in size
and time. Loading only what a command needs takes lazy `import()` at the entry
point, which no structural rule asks for.

## Second round on ccmanager: hard tasks, scored by hidden tests

The rounds above have three weaknesses that a skeptic would name: total tokens
are dominated by the conversation being re-sent on every turn (cache reads were
80-90% of them), the edit tasks were easy enough that every run succeeded, and
the agent could not run the tests. Traces of four of those runs also showed that
Claude Code does not read a god file whole: it searched, then read
`worktreeService.ts` at `offset=335 limit=70`. When it did read a whole
27k-character component, the split tree read 41% fewer characters but needed 15
tool calls instead of 6.

The design of this round was reviewed by Codex before any run, and its
corrections were adopted:

- **Hidden acceptance tests written and frozen before the runs** (13 tests in
  three files, SHA-256 recorded), importing only paths with the same API in both
  trees. Each failed on both untouched trees for the intended reason; four guard
  tests passed on both.
- **Correctness first.** A run passes when the hidden tests, the full existing
  suite and `tsc --noEmit` all pass.
- **Real working conditions.** Bash allowed for tests, typecheck and git; a
  git-initialised copy per run; 60 turns per task, 120 for the long session.
- **Paired runs**: each before/after pair ran at the same time, arm order
  randomised.
- **Separate metrics**: code read (characters returned by file reads and
  searches), test and shell output, fresh context, total tokens and cost.

Tasks, given verbatim to the agent:

- **include** - stop `.worktreeinclude` copying from following symlinks out of
  the source or through a symlinked destination directory.
- **branch** - make generated branch names valid git refs, free of ref-path
  prefix conflicts, within the length budget.
- **merge** - leave no merge or rebase in progress after a conflict, without
  aborting an unrelated operation.
- **long** - all of the above as five numbered edits in one session.

72 runs: ten pairs per task, six for the long session. Claude Code 2.1.296,
Sonnet.

| task    | pass before / after | hidden tests before / after | cost after / before (95% CI) | code read after / before (95% CI) | total tokens after / before |
| ------- | ------------------: | --------------------------: | ---------------------------: | --------------------------------: | --------------------------: |
| include |        9/10 / 10/10 |                 100% / 100% |            1.12 [0.98, 1.20] |                 1.09 [0.58, 2.12] |                        1.20 |
| branch  |         0/10 / 0/10 |                   86% / 86% |            1.01 [0.91, 1.40] |                 1.92 [1.13, 3.35] |                        1.06 |
| merge   |        10/10 / 9/10 |                 100% / 100% |            0.96 [0.84, 1.14] |                 0.71 [0.30, 1.70] |                        1.05 |
| long    |           6/6 / 6/6 |                 100% / 100% |            1.08 [0.94, 1.22] |                 0.85 [0.36, 1.83] |                        0.92 |

Ratios are of medians; intervals are bootstrap 95%. Notes on the scoring:

- Every branch run, in both trees, failed the same hidden test: the 60-character
  budget after deduplication, which the prompt states only as "keep the existing
  length budgets". The test was frozen, so it was not relaxed after the fact.
- `returnToMenu.test.ts`, a terminal end-to-end test, failed in 41 runs; run
  serially afterwards it also failed on both untouched trees, so it was excluded
  as environmental. The two remaining failures (one per tree) are the same
  timing-sensitive `App.test.tsx` case, in tasks that do not touch it.
- When the agent sent a command to the background, the session reported several
  results; usage was summed across them.

On these tasks the strict layout made no difference to whether the agent got the
change right, and cost between 4% less and 12% more. The one difference outside
the noise is that the agent read about twice as much code in the split tree for
the branch task, whose logic is spread over many small files.

## Third round: keeping the rules and removing their costs

The second round left three measured costs of the strict layout: an unbundled
Node build starts about 20% slower, the agent read about twice as much code on
the branch task, and the gates take longer. Five ways of removing them while
keeping every rule were proposed, reviewed by Codex before any run, and tested.

### Startup (no agent runs)

Six builds of ccmanager, timed on an otherwise idle Apple M1 laptop, 25
randomised interleaved rounds. "Menu" is the time from launch to the first
rendered menu in a pseudo-terminal; bundled means a single file built with
`bun build --target=node`.

| build                                 | own modules on `--version` | `--version`, unbundled | `--version`, bundled | menu, unbundled | menu, bundled |
| ------------------------------------- | -------------------------: | ---------------------: | -------------------: | --------------: | ------------: |
| original                              |                         86 |                 351 ms |               135 ms |          420 ms |        202 ms |
| original, entry loads app lazily      |                          1 |                  62 ms |                93 ms |          421 ms |        211 ms |
| strict                                |                        968 |                 436 ms |               136 ms |          506 ms |        204 ms |
| strict, entry loads app lazily        |                          3 |                  60 ms |                94 ms |          507 ms |        215 ms |
| strict, type-only imports enforced    |                        911 |                 442 ms |               136 ms |          507 ms |        204 ms |
| strict, lazy entry and type-only both |                          3 |                  60 ms |                94 ms |          509 ms |        215 ms |

- **Bundling removes the cost entirely**: 202 ms against 204 ms to a usable
  menu, and either build starts twice as fast as the original did unbundled.
  "Ship one bundled file" is a rule that keeps the strict layout and loses
  nothing.
- **A lazy entry point** (`import()` of the app after flags are parsed) makes
  `--version` and `--help` six times faster in both trees, but not a normal
  launch, which needs the whole app.
- **Enforcing type-only imports** (`verbatimModuleSyntax`,
  `consistent-type-imports`) stopped 57 empty modules from loading and saved no
  measurable time.

### Navigation (agent runs)

- **Grouping by feature** was not run: in the second round's traces the agent
  already worked inside one directory for the branch task
  (`services/worktreeNameGenerator/`, 24 of its 29 source-file reads). The extra
  reading came from opening many small files in that directory, not from
  crossing directories.
- **A generated file map**: every directory with three or more source files got
  a `CLAUDE.md` listing each file with its exported declaration (111 maps), and
  a root `CLAUDE.md` pointing at them. Ten paired branch runs against the strict
  tree without maps: cost ratio 1.00 [0.86, 1.39], code read 1.01 [0.76, 1.24],
  hidden tests identical. The map made no difference.

### Gates

Measured on the M1 laptop, five runs each:

| check                                 | original | strict |
| ------------------------------------- | -------: | -----: |
| `tsc --noEmit`                        |   2.05 s | 2.34 s |
| `tsc --noEmit --incremental`, warm    |   1.29 s | 1.40 s |
| `tsgo` (TypeScript 7 preview)         |   0.34 s | 0.41 s |
| full `vitest --run`                   |   14.5 s | 14.5 s |
| `vitest related` for the changed file |   3.66 s | 4.01 s |

A mutation in the branch deduplication was caught by `vitest related` with the
same three failures as the full suite. So the strict layout adds about 0.3 s to
a check, and the fast commands cut checks by four to six times. Six paired long
sessions on the strict tree, one arm told to use the fast commands while
working: cost ratio 1.07 [0.91, 1.32], all twelve runs correct. Waiting for a
check does not cost tokens, so faster gates save wall-clock time, not money.

### Decay over twenty changes (agent runs)

The case for strict rules is that they stop a codebase from decaying, which a
single task cannot show. Twenty successive tasks were written for ccmanager
(branch naming, `.worktreeinclude` copying, worktree locking and pruning, merge
safety, search syntax, session cleanup), each building on the previous ones and
each with a hidden acceptance test frozen before any run. A reference
implementation and a separate blind one both passed all twenty. The agent ran
the twenty tasks in order on its own output, a fresh session per task, in three
arms:

- **A**: the original tree, checked only by typecheck and the existing tests.
- **B**: the strict tree, plus the strict judge as a ratchet: no new violation
  in any file, existing ones accepted.
- **C**: the original tree with the same ratchet, so new code must be strict
  while the god files stay.

A task was accepted when typecheck, the existing suite and (B, C) the ratchet
passed, with up to two repair sessions fed the check output. Hidden tests were
scored with the agent stopped and never shown to it. Two chains for A and B, one
for C, 100 tasks in all.

| chain | accepted | hidden tests passed | regressions | repair sessions | cost, 20 tasks | new judge violations | largest file |        files |
| ----- | -------: | ------------------: | ----------: | --------------: | -------------: | -------------------: | -----------: | -----------: |
| A1    |    20/20 |               20/20 |           0 |               2 |          $4.15 |                  +42 | 1449 to 1842 |     92 to 94 |
| A2    |    20/20 |               20/20 |           0 |               2 |          $3.88 |                  +54 | 1449 to 1866 |     92 to 94 |
| B1    |    20/20 |               20/20 |           0 |               1 |          $4.91 |                    0 |   175 to 175 | 1342 to 1388 |
| B2    |    20/20 |               20/20 |           0 |               2 |          $5.10 |                    0 |   175 to 175 | 1342 to 1399 |
| C1    |    20/20 |               20/20 |           0 |               8 |         $10.10 |                   -6 | 1449 to 1470 |    92 to 165 |

- **The gate stops decay, and only the gate.** Without it the largest file grew
  by 400 lines and fifty new violations appeared in twenty tasks; with it, none,
  in either tree.
- **Decay did not hurt the agent within twenty tasks.** Every chain got every
  task right, broke nothing earlier, and the unguarded arm's last five tasks
  cost about what its first five did ($0.89 and $0.90, $0.79 and $0.97).
- **Keeping the rules costs agent money.** The strict tree cost 24% more over
  the chain ($5.00 against $4.02 mean); retrofitting the rules onto a god-file
  tree cost two and a half times as much ($10.10), since every change to a god
  file had to be extracted into new strict files (73 of them).
- Duplication stayed flat in every arm (jscpd within 0.3 points).

## Conclusion

| subject                       | starting point               | tokens, edit tasks | cost, all tasks | correctness |
| ----------------------------- | ---------------------------- | -----------------: | --------------: | ----------: |
| private CLI                   | already tidy (max 174 lines) |               +70% |            +12% |        same |
| ai-digest                     | 1039-line god file           |               -20% |             -6% |        same |
| ccmanager, one file           | 1546-line god class          |                -2% |             -9% |        same |
| ccmanager, whole repo         | 18k lines, max 1449 lines    |       -2% and +33% |             -1% |        same |
| ccmanager, hard hidden-tested | same                         |        -8% to +20% |     -4% to +12% |        same |
| ccmanager, 20-task chain      | same, strict tree            |                    |            +24% |        same |
| ccmanager, 20-task chain      | same, rules on new code only |                    |           +151% |        same |

"Fewer tokens" is not a claim these measurements support, and neither is "the
agent makes fewer mistakes": with a modern coding agent that searches and reads
line ranges, a god file costs it little, and on hard tasks scored by hidden
tests both layouts were equally correct, over single tasks and over a chain of
twenty. The 6-9% cost reduction seen with three runs per cell did not hold up
with more runs.

What the rules do measurably buy is that the structure holds. Over twenty
changes, the unguarded tree's largest file grew by 400 lines and gained fifty
violations; the gated trees gained none. That is the gate, not the layout: the
rules hold only while a check enforces them. Its price is agent cost, about a
quarter more on a tree that is already strict and two and a half times as much
when the rules are applied to new code in a god-file tree. Within twenty changes
the unguarded tree's decay had not yet made the agent slower or less accurate,
so this is a bet on longer horizons and on human readers, which these runs do
not measure.

Of the remedies tried, one removes a cost outright: shipping a bundled build
erases the startup penalty. Lazy entry points, type-only imports, generated file
maps and faster checks changed nothing an agent pays for.

Raw per-run JSON was kept in the session scratchpad, not committed.
