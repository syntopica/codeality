<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

<!-- tadu:rule v5 -->

## Continuous TODO, Work Log, and History Coverage

Keep the active backlog and the searchable record of closed work with tadu. This
repository keeps one JSON file per task under `todo/` (format 2, `todo/tadu.json`).
Use `TODO_HISTORY_INDEX.jsonl`, when present, to avoid parsing unchanged
conversations more than once.

- Never edit task files by hand. Use `tadu add` (with category, type and
  priority), `tadu set ID key=value`, `tadu claim ID --as agent:<name>` before
  working on a task, and `tadu close --id ID --evidence "<proof>"`
  (`--resolution`, or `--duplicate-of ID`). Close reports the tasks that no
  longer wait on it; decide for each whether it moves to pending. Every command
  is a dry run until `--write`.
- Do not read the backlog files whole: query them. `tadu list` filters with
  `--category`, `--type`, `--text`, `--due-within N`, `--overdue`,
  `--min-priority`, `--open` (pending work only) and `--history`; `tadu ready`
  lists what can start now; `tadu show KEY` prints one item. When more items
  follow, a list says so on stderr: page with `--offset` or narrow the filter.
- Before recording work or reopening an old task, run `tadu similar "<title>"`
  and update the existing item instead of creating a duplicate.
- Record actionable bugs, risks, blockers, deferred work, missing tests,
  validation, documentation, and product improvements as they are discovered.
  A task is pending, in_progress, blocked, done or cancelled. Keep blockers open
  and name the smallest action required to unblock them.
- Give a task a kind when it is clear what it is: `task` for work you can do,
  `decision` for a choice a person must make, `waiting` for something someone
  else owes, `later` for something not to do now. Leave it out when unclear.
  `due` is the deadline, `check_on` the day to look at the task again and
  `defer_until` the day before which it cannot start.
- Take work with `tadu next`; `tadu inbox` lists what waits on a person and
  `tadu urgent` what is urgent. When only a person can answer a question while
  you work alone, record it (`tadu add --kind decision`), add the decision to
  the `blocked_by` of the task it holds up with `tadu set`, and go on with the
  next task.
- In anything a person reads, such as a summary, a report or a question, name a
  task by its title, never by its ID; IDs stay in commands and tool calls.
- Before reviewing past conversations, consult the history index and skip
  unchanged records already marked `complete` or `irrelevant`. Update a record
  only after its findings are reconciled; interrupted work stays `partial`.
- Do not interrupt the active task for unrelated non-critical work, and do not
  implement unrelated TODO items unless requested. Immediately report critical
  security, destructive, or data-loss findings. Never put secrets in the
  backlog.

Run `tadu doctor .` after changing the backlog and before committing. If `tadu`
is not on PATH, install it as https://github.com/syntopica/tadu#install
describes, or report that it is missing. Format: tadu spec v2,
https://github.com/syntopica/tadu/blob/main/spec/todo-format-v2.md. A connected
`tadu mcp` server offers the same tools. The tadu-create and tadu-work skills
automate these workflows and are optional.
<!-- /tadu:rule -->
