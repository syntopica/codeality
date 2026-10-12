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

Raw per-run JSON was kept in the session scratchpad, not committed.
