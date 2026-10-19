# Dart and Swift Baselines — Design

Date: 2026-10-19 Status: Approved (revised after builder check, Codex review and
read-only measurements on stagebeat)

## Goal

Give Dart/Flutter and Swift projects the same discipline codeality already
enforces for TypeScript, Python (`codeality-py`) and Rust (`cargo-baseline`):
strict lint, formatting, atomic files (one unit per file, name/unit agreement,
size caps, no grab-bag modules, no inline SQL), duplicate detection, a debt
baseline for adoption, a CI gate, and estate visibility.

The owner asked for parity with the existing language packages, not a new kind
of feature: "simplemente quiero soportarlo como soportamos python y otros". Both
languages ship in this round.

The first consumer and test bed is `~/p/stagebeat` (measured 2026-10-19):

- Dart: 1,301 tracked files — 903 in `apps/mobile/lib`, 357 in
  `apps/mobile/test`, 36 in `packages/click_core`. 43,217 lines in `lib`.
  Largest hand-written files: `app/metronome_controller.dart` 1,745 lines,
  `audio/metronome_transport.dart` 841, `ui/song_editor_dialog_state.dart` 584.
  `data/stagebeat_database.g.dart` (4,229) is drift-generated.
- Swift: 15 files — Runner plugins under `apps/mobile/ios/Runner/` and macOS,
  plus a 6-file SwiftUI watchOS app in `apps/mobile/ios/StagebeatWatch/`. No
  `Package.swift`; the files live inside Xcode projects.
- Kotlin: 3 files. Out of scope.
- Two Dart projects, each with its own `pubspec.yaml`: `apps/mobile` (Flutter,
  depends on `drift_dev`, `build_runner`, `flutter_lints ^6.0.0`) and
  `packages/click_core` (pure Dart, `lints ^6.0.0`). No melos, no root
  workspace, no `package.json`, no `pyproject.toml`.
- Current gate: Ubuntu CI runs `flutter analyze`, `flutter test`, a grep that
  forbids `package:flutter` / `dart:ui` imports in `lib/domain`, and `dart test`
  in `click_core`. No format check, no Swift lint, no coverage floor.
  `analysis_options.yaml` in `apps/mobile` excludes `ios/`, `android/`,
  `macos/`, `windows/`, `build/`.
- Local tools: Dart 3.13.5, Swift 6.4 (ships `swift format`), `osv-scanner`
  present. `swiftlint` not installed.

Measured on stagebeat itself, read-only, 2026-10-19, to size the adoption:

| Check                                                  | Result                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `flutter analyze` (current lint set)                   | No issues, 5.4 s                                                                                                               |
| `dart format --set-exit-if-changed lib test`           | 1,260 files, 0 changed                                                                                                         |
| `swift format lint --strict` on the 15 Swift files     | 140 output lines: Swift needs a formatting pass                                                                                |
| `osv-scanner scan --lockfile apps/mobile/pubspec.lock` | 199 packages, no issues                                                                                                        |
| jscpd 5.4.1, `dart`, minTokens 70, `*.g.dart` ignored  | `lib`: 16 clones, 0.83 %. `lib` + `test`: 71 clones, 1.59 %, over the 1 % threshold                                            |
| jscpd 5.4.1, `swift`                                   | 0 clones                                                                                                                       |
| Rough grep of `apps/mobile/lib` (not the real rules)   | 902 files; ~325 with more than one top-level declaration (inflated by widget/State pairs); 27 over 150 lines; 0 grab-bag names |
| Hand-written `part`                                    | Only `data/stagebeat_database.dart` -> its drift `*.g.dart` (must stay legal)                                                  |

So for stagebeat: analyze, format (Dart) and audit pass on day one; Swift needs
one mechanical format commit; duplicates (with tests) and structure need the
debt baseline. jscpd's JSON report carries `fragment`, `firstFile` and
`secondFile` with start/end, which is what clone fingerprinting needs.

## Non-goals

- Kotlin, Objective-C, C. Stagebeat's 3 Kotlin and handful of C/ObjC files stay
  unchecked.
- IDE integration (analyzer plugin, SourceKit-LSP plugin). v1 is a CLI and a CI
  gate, like `codeality-py`.
- Swift tests in the gate. Stagebeat's Swift lives in Xcode targets that need
  `xcodebuild` and a simulator; running them is not a lint concern.
- Rewriting stagebeat to pass. Adoption uses the debt baseline; paying the debt
  down is stagebeat's own backlog.
- Adding duplicate detection to `codeality-py` or `cargo-baseline`.

## Anti-goals

- A green gate that did not run. A required stage whose tool is absent is an
  infrastructure failure (exit 3), never a skip — same contract as
  `codeality-py gate`.
- `init` silently replacing a consumer's existing `analysis_options.yaml`
  (stagebeat's carries strict-casts/inference/raw-types and its excludes).
- A tool dependency that breaks the consumer's `pub get` (see "Why two Dart
  packages").
- Atomic rules that flag every idiomatic Flutter widget. A `StatefulWidget` and
  its `State` are one unit.

## Shape and distribution

Mirrors the existing packages: each tool is written in its own language with its
native parser, lives under `packages/`, sits outside the pnpm/turbo workspace,
and gets its own job in `.github/workflows/ci.yml`.

### Dart — two packages

| Directory                       | pub.dev name      | Role                                                                        |
| ------------------------------- | ----------------- | --------------------------------------------------------------------------- |
| `packages/codeality-dart-lints` | `codeality_lints` | `lib/analysis_options.yaml` only. No dependencies. Consumer dev_dependency. |
| `packages/codeality-dart`       | `codeality_dart`  | The CLI (`codeality-dart`), built on `package:analyzer`.                    |

**Why two Dart packages.** Dart resolves
`include: package:x/analysis_options.yaml` only when `x` is a dependency of the
project, so the shared lint set must be a dev_dependency, like `flutter_lints`.
The CLI cannot be one: it depends on `package:analyzer`, and stagebeat already
depends on `drift_dev`, which pins its own `analyzer` range. A second `analyzer`
constraint in the same `pubspec.lock` is a version-solving failure waiting for
the next upgrade of either side. So the lint set is a dependency-free
dev_dependency (`codeality_lints`), and the CLI is installed with
`dart pub global activate codeality_dart <pinned version>`, the pin living in
the consumer's CI workflow. This also mirrors the `eslint-config` /
`eslint-plugin-code-policy` split.

**Publishing.** pub.dev supports GitHub OIDC publishing, but only from a
workflow triggered by a **pushed git tag** — `workflow_dispatch` is not
accepted, unlike `publish.yml` and `publish-python.yml`. New workflow
`.github/workflows/publish-dart.yml`, triggered on tags
`codeality_lints-v[0-9]+.[0-9]+.[0-9]+` and
`codeality_dart-v[0-9]+.[0-9]+.[0-9]+`, calling
`dart-lang/setup-dart/.github/workflows/publish.yml@v1` with `id-token: write`,
environment `pub.dev`, and `working-directory` chosen from the tag prefix. That
reusable workflow only takes `environment` and `working-directory` and runs
`pub get`, a dry run and the publish, with no hook for a gate, so
`publish-dart.yml` has a separate `verify` job that checks out the same tag and
runs the package's own gate, and the publish job `needs: verify`. On pub.dev,
each package's Admin tab must enable automated publishing for repository
`syntopica/codeality`, tag pattern `<name>-v{{version}}`, required environment
`pub.dev`; the GitHub `pub.dev` environment must exist. The first publish of a
new pub.dev package cannot be automated: it is done once by hand by the owner
(`dart pub publish`) and the automation is enabled afterwards. `CLAUDE.md` gets
a section like the PyPI one.

### Swift — one package

`packages/codeality-swift`: a SwiftPM executable package (`codeality-swift`)
built on `swift-syntax`, joined to nothing else. Not on a registry in v1, like
`cargo-baseline`: consumers build it from a git tag
(`codeality-swift-v<version>`). The CI asset clones that tag and runs
`swift build -c release`, caching `.build` keyed on the tag. It must build and
run on Linux (stagebeat CI is Ubuntu) and macOS; `swift-syntax` supports both.

A cold release build of `swift-syntax` 604.0.0 (SwiftParser and
SwiftParserDiagnostics) took 178 s on this Mac (Codex review), so the generated
CI caches `.build` keyed on OS, architecture, Swift toolchain version and the
tool tag. Linux is supported upstream (swift-syntax CI runs Linux builds) but
was not executed here; the codeality `swift` CI job on Ubuntu is where it is
proven.

It must work on **plain directories of `.swift` files**, not only SwiftPM
packages, because stagebeat has no `Package.swift`. Roots come from config.

### Naming

Directory names follow `codeality-py`. Rule-code prefixes follow `BPY`: `BDT`
for Dart, `BSW` for Swift. Config files follow each ecosystem's habit (YAML for
both): `codeality-dart.yaml` beside `pubspec.yaml`, `codeality-swift.yaml` at
the configured Swift project root.

## Commands

Same surface as `codeality-py`, with the same contracts (plan/apply/force for
`init`, read-only `check`, explicit-writer `baseline`, all-stages-by-default
`gate` with `--fail-fast` and `--json`):

```
codeality-dart init [--check] [--apply] [--force] [--ci] [--profile app|package]
codeality-dart check [PATH...] [--format text|json] [--fail-fast]
codeality-dart baseline create|update|check
codeality-dart gate [--fail-fast] [--json]

codeality-swift init [--check] [--apply] [--force] [--ci]
codeality-swift check [PATH...] [--format text|json] [--fail-fast]
codeality-swift baseline create|update|check
codeality-swift gate [--fail-fast] [--json]
```

Exit codes: 0 clean, 1 findings, 2 configuration error or `init --check`
conflict, 3 infrastructure failure (required tool missing or crashed). Text
diagnostics: `path:line:col: BDT001 one-primary-unit: <message>`. JSON output is
versioned, on stdout, with logs on stderr.

### Debt baseline — covers every stage that produces findings

The baseline file (`.codeality-dart-baseline.json`,
`.codeality-swift-baseline.json`) uses the same fingerprint idea as gate-kit and
`codeality_py/baseline` — `new`, `known`, `resolved` counts; stale entries
reported, not kept forever — but, unlike `codeality-py`, it records findings
from **three** sources, each under its own section (designer's call, after the
builder check showed adoption cannot otherwise go green without rewriting
stagebeat):

- `structure`: `BDT`/`BSW` findings.
- `analyzer` (Dart) / `swiftlint` (Swift): parsed from
  `dart analyze --format=machine --fatal-infos` and
  `swiftlint lint --reporter json`. `flutter analyze` has **no** `--format`
  option (verified: exit 64, `Could not find an option named "--format"`), so
  Flutter projects run `flutter pub get` and then the Flutter SDK's bundled
  `dart analyze --format=machine`. Machine records are
  `severity|type|code|absolute path|line|column|length|message`; paths are
  normalised to project-relative before fingerprinting, and a tool crash is told
  apart from diagnostics. Fingerprint: path, diagnostic code, and a hash of the
  trimmed source line, never the line number, so edits elsewhere in the file do
  not churn it.
- `duplicates`: one entry per jscpd clone, fingerprinted by the two paths
  (sorted, so pair order does not matter) and a hash of the fragment with
  whitespace collapsed. With a baseline, the stage fails on any `new` clone
  regardless of the percentage threshold; without one, the jscpd threshold
  applies as for TypeScript.

Every section is a **multiset**: the baseline stores each fingerprint with an
occurrence count, and a stage fails when the current count of any fingerprint
exceeds the recorded one. A set would hide debt: two identical `print(count);`
lines in one file produce two `avoid_print` records with the same key (verified
by the Codex review). Regression tests add a second copy of an already-baselined
line and of an already-baselined clone in the same files and expect red.

Formatting and coverage are not baselined: formatting is fixed mechanically once
at adoption (`dart format .` / `swift format --in-place`, one commit; stagebeat
needs it for Swift only), and coverage uses a per-project floor (below).

A Dart project root is a directory with a `pubspec.yaml`. A repository with
several (stagebeat has two) runs the tool once per project; `codeality-dart`
does not walk into nested pubspec projects.

### CI wiring for repositories with several projects

GitHub only discovers workflows in `.github/workflows/` at the repository root,
and stagebeat has two pubspec projects plus Swift. So `init --ci` always targets
the **git root**, never the project directory:

- It writes or merges one reusable workflow, `.github/workflows/codeality.yml`,
  triggered by `workflow_call` (and `workflow_dispatch`), with one job per
  project. Job ids are derived from the project path (`dart-apps-mobile`,
  `dart-packages-click-core`, `swift`), each with its own `working-directory`
  and pinned tool versions. Running `init --ci` from a second project adds its
  job and leaves the others untouched; re-running is idempotent; a job with the
  same id but different content is a reported conflict.
- The repository's own CI calls it from a job of its choice
  (`jobs.<id>.uses: ./.github/workflows/codeality.yml`). A caller job can be the
  target of `needs:`, which matters for stagebeat (below). When no CI workflow
  exists, `init` also writes a minimal caller on push and pull_request.
- Both `codeality-dart init --ci` and `codeality-swift init --ci` merge into the
  same file.

### `init` — merge or refuse

- The include target depends on the project:
  `package:codeality_lints/flutter.yaml` when `pubspec.yaml` depends on the
  Flutter SDK, otherwise `package:codeality_lints/analysis_options.yaml`.
- `analysis_options.yaml` missing: write one with that include plus the default
  excludes.
- Present: add or replace only the `include:` line and add missing excludes,
  preserving the rest (stagebeat's `strict-*` flags and extra rules). Replacing
  an existing include (`package:flutter_lints/flutter.yaml`) is reported as a
  `merge`. `codeality_lints` inlines the upstream rule lists it supersedes (see
  "Lint set"), so nothing is lost; a test asserts a Flutter-only rule is active
  after migrating a Flutter fixture, and that local overrides survive. Local
  `linter.rules` lists merge with the included ones (verified by the Codex
  review).
- Adds `codeality_lints` to `dev_dependencies` and removes `flutter_lints` /
  `lints` when it supersedes them; reports that `pub get` must be rerun.
- Writes `codeality-dart.yaml`; with `--ci`, merges its job into the root
  `codeality.yml` (see "CI wiring").
- `codeality-swift init` writes `codeality-swift.yaml`, a `.swift-format` config
  and a `.swiftlint.yml`; with `--ci`, merges the `swift` job.

## Lint set and formatting

### Dart

`codeality_lints` ships two files: `analysis_options.yaml` (pure Dart, builds on
`package:lints/recommended.yaml` semantics) and `flutter.yaml` (adds the Flutter
rules). Because `codeality_lints` has no dependencies, it cannot `include:`
other packages; it **inlines** the recommended (and Flutter) rule lists, pinned
to the versions stagebeat uses today, and adds on top:

- `analyzer.language`: `strict-casts`, `strict-inference`, `strict-raw-types`.
- `analyzer.errors`: lint infos promoted so `dart analyze --fatal-infos` fails.
- A strict rule set chosen by the builder from the Dart linter's catalogue,
  starting from stagebeat's four extra rules (`prefer_final_locals`,
  `prefer_const_constructors`, `always_declare_return_types`, `avoid_print`) and
  adding the type-safety and API-hygiene rules that do not fight Flutter idioms.
  Each added rule must pass on `templates/dart-package` and
  `templates/flutter-app`, and its count on stagebeat is recorded in the rollout
  notes.

Formatting is `dart format --output=none --set-exit-if-changed`, default style.

### Swift

`swift format lint --strict` with a shipped `.swift-format` config is
**required** (it ships with the toolchain, so it is always present where Swift
is). `swiftlint` is an **optional** stage: it runs when installed, and its
absence is reported as `skipped-not-applicable` with the reason. The shipped
`.swiftlint.yml` disables the rules that duplicate `swift format` and the
structural rules `codeality-swift` owns (`file_length`, `type_body_length`), so
one finding never shows up twice.

## Structural rules — Dart (`BDT`)

| Code     | Rule                   | Enforces                                                                                                 |
| -------- | ---------------------- | -------------------------------------------------------------------------------------------------------- |
| `BDT000` | `parse-error`          | A file the analyzer cannot parse is a finding, never a silent skip.                                      |
| `BDT001` | `one-primary-unit`     | Exactly one top-level declaration per ordinary file, private ones included (exceptions below).           |
| `BDT002` | `file-matches-unit`    | File name is the `snake_case` of the sole declaration's name (leading `_` dropped).                      |
| `BDT003` | `no-grab-bag-names`    | `utils`, `helpers`, `misc`, `common` banned as a file stem or any directory segment, case-insensitive.   |
| `BDT004` | `max-file-lines`       | Cap on occupied non-comment lines. Default 150; tests 300.                                               |
| `BDT005` | `barrel-only`          | A file with `export` directives contains only directives (library, import, export) and no declarations.  |
| `BDT006` | `no-inline-sql`        | SQL-shaped string literals banned in `.dart`; queries live in configured globs (drift's `.drift` files). |
| `BDT007` | `no-hand-written-part` | `part 'x';` only when `x` is a generated file; `part of` only inside generated files.                    |

`BDT007` exists because `part` would otherwise let one library spread over many
files and defeat `BDT001` and `BDT004` while each file looks small. The
code-generation pattern stays legal: stagebeat's `data/stagebeat_database.dart`
with `part 'stagebeat_database.g.dart';` passes.

Structural rules read the syntax tree only (`parseString`), never a resolved
AST: the global-activated tool cannot resolve the consumer's Flutter packages,
and none of the rules needs types (the `State<ThatWidget>` exception matches the
type name syntactically). Verified by the Codex review: a StatefulWidget/State
pair parses with zero diagnostics without resolved Flutter imports. Semantic
diagnostics come only from the `analyze` stage.

Counted top-level declarations: class, mixin, mixin class, enum, extension,
extension type, typedef, top-level function, top-level getter/setter, top-level
variable. Exceptions in `BDT001`, all syntactic:

- A public `StatefulWidget` subclass plus one class whose `extends` clause is
  `State<ThatWidget>` count as one unit (the widget is the primary; `BDT002`
  matches the widget).
- An extension whose `on` type is the file's primary type counts with it.

Roles, assigned before any rule runs, in this precedence, exactly one per file:
`excluded` → `generated` → `test` → `barrel` → configured `entrypoint` / `data`
→ `ordinary`. Semantics match `codeality-py`:

- `generated`: `*.g.dart`, `*.freezed.dart`, `*.mocks.dart`, `*.gr.dart`,
  `*.config.dart`, `lib/l10n/**` generated output, configured globs, and files
  whose first lines carry a `// GENERATED CODE` / `// Generated by` marker. All
  rules exempt. Never inferred from size.
- `test`: `test/**`, `integration_test/**`, `*_test.dart`. `BDT001`/`BDT002`
  exempt; `BDT003`, `BDT006` and the test line cap apply.
- `barrel`: a file whose body is directives only. `BDT005` governs it.
- `entrypoint` (default `lib/main.dart`, `bin/*.dart`, plus configured globs):
  one `main` function; `BDT002` exempt.
- `data`: configured; constants and static collections only, no functions or
  classes; `BDT002` exempt.

Two configured roles claiming one file is a configuration error (exit 2).

## Structural rules — Swift (`BSW`)

| Code     | Rule                | Enforces                                                                                                  |
| -------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| `BSW000` | `parse-error`       | A file `swift-syntax` cannot parse cleanly is a finding.                                                  |
| `BSW001` | `one-primary-unit`  | Exactly one top-level type or function per ordinary file (exceptions below).                              |
| `BSW002` | `file-matches-unit` | `Name.swift` for a file whose primary is `Name`; `Name+Topic.swift` for an extension-only file of `Name`. |
| `BSW003` | `no-grab-bag-names` | Same banned names as Dart, matched against `UpperCamel` and lowercase forms.                              |
| `BSW004` | `max-file-lines`    | Default 150; tests 300.                                                                                   |
| `BSW005` | `no-inline-sql`     | SQL-shaped string literals banned.                                                                        |

Counted top-level declarations: `struct`, `class`, `enum`, `actor`, `protocol`,
`typealias`, `func`, top-level `let`/`var`, `macro`. Exceptions in `BSW001`:
extensions of the primary type in the same file; a `#Preview` macro or a
`PreviewProvider` conformer for the primary view; the `@main` type in an
`entrypoint` file.

Roles: `excluded` → `generated` (`GeneratedPluginRegistrant.*`, configured
globs, generated markers) → `test` (`*Tests.swift`, `Tests/**`) →
`extension-only` → configured `entrypoint` → `ordinary`. There is no barrel
concept in Swift.

`extension-only` is a file with zero counted declarations and one or more
`extension` declarations, all of the same extended type. Its unit is that type:
`BSW001` requires every extension to extend the same type, and `BSW002` requires
the name `Type+Topic.swift`, where `Type` is the extended type's last name
component with generic arguments dropped (`extension Array<Beat>` ->
`Array+Topic.swift`, `extension Foo.Bar` -> `Bar+Topic.swift`). A fixture covers
a standalone `Name+Topic.swift`.

## Gate stages

### `codeality-dart gate`

| Stage      | Required | Command                                                                                                                  |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| format     | yes      | `dart format --output=none --set-exit-if-changed <roots>`                                                                |
| analyze    | yes      | `dart analyze --format=machine --fatal-infos` (Flutter projects: after `flutter pub get`, with the Flutter SDK's `dart`) |
| structure  | yes      | `codeality-dart check` (or `baseline check` when a baseline file exists)                                                 |
| duplicates | yes      | jscpd over the configured roots with the `dart` format (see "Duplicates")                                                |
| test       | yes      | `flutter test --coverage` / `dart test --coverage=coverage`, then a line-coverage floor read from lcov (default 80%)     |
| audit      | yes      | `osv-scanner scan --lockfile pubspec.lock`                                                                               |

`dart pub` has no audit subcommand (checked against the current `dart pub`
command list), so `osv-scanner`, which reads `pubspec.lock`, is the audit tool.
Coverage for pure-Dart packages needs `package:coverage` to produce lcov; the
builder picks the exact invocation. The coverage floor and test-time budget are
config keys, as in `codeality-py`.

### `codeality-swift gate`

| Stage      | Required | Command                                          |
| ---------- | -------- | ------------------------------------------------ |
| format     | yes      | `swift format lint --strict --recursive <roots>` |
| swiftlint  | optional | `swiftlint lint --strict <roots>` when installed |
| structure  | yes      | `codeality-swift check` / `baseline check`       |
| duplicates | yes      | jscpd with the `swift` format                    |

## Duplicates

jscpd 5.4.1 (already used by `baseline-dupes`) supports both `dart` and `swift`
formats. Changes:

- Add `"dart"` and `"swift"` to `packages/quality-config/jscpd.json` formats,
  and the generated-file globs (`**/*.g.dart`, `**/*.freezed.dart`,
  `**/.build/**`, `**/build/**`, `**/.dart_tool/**`) to its ignore list.
- `baseline-dupes` cannot be reused from a non-Node consumer: it shells out to
  `pnpm exec jscpd`, and jscpd is only a root devDependency of codeality, not a
  dependency of `@syntopica/quality-config`. Changing that is out of scope
  (designer's call: it would be a cross-cutting release for every TypeScript
  adopter). Instead each tool runs
  `npx --yes jscpd@<pin> --reporters json --output <tmp>` itself, with a jscpd
  config **generated at build time from `packages/quality-config/jscpd.json`**
  (minTokens, threshold, ignore list, plus the language format) and embedded in
  the binary. A codeality CI check fails when the embedded copy and `jscpd.json`
  diverge, so there is still one source of truth. The jscpd pin follows the root
  `package.json` version.
- jscpd's own `isNew` field is not debt status (it is `false` even on a fresh
  run); new versus known comes only from the codeality baseline.
- Node is a required tool for this stage (present on GitHub runners and on this
  machine); missing Node is exit 3. Consumers may override `minTokens` and
  `threshold` in their codeality config.

## Templates

Each template must pass its tool's gate in codeality CI, as
`templates/python-package` does:

- `templates/dart-package` — pure Dart package.
- `templates/flutter-app` — minimal Flutter app (one screen, one stateful
  widget, one test). CI installs Flutter for this job.
- `templates/swift-package` — SwiftPM library with one type and a test target.

## codeality CI

New jobs in `.github/workflows/ci.yml`:

- `dart`: setup Dart and Flutter; for `packages/codeality-dart`: format,
  analyze, `dart test` with coverage, `codeality-dart gate` on itself; then the
  gate on both Dart templates.
- `swift`: on `ubuntu-latest` with the Swift toolchain; `swift build`,
  `swift test`, `codeality-swift gate` on itself and on
  `templates/swift-package`.

## Estate integration

Following `packages/create-baseline/bin/python/`:

- `estate/findDartConsumers.mjs`: `pubspec.yaml` with `codeality_lints` in
  `dev_dependencies`, up to 3 levels deep.
- `estate/findSwiftConsumers.mjs`: a `codeality-swift.yaml`.
- `dart/runDartConformance.mjs` and `swift/runSwiftConformance.mjs`: the gate
  workflow exists, and the pinned tool versions match `dart-versions.json` /
  `swift-versions.json`. Findings prefixed `dart-` / `swift-`.
- `formatDartEstate.mjs` / `formatSwiftEstate.mjs`: extra tables in
  `baseline-estate`, like the Python one.

`release:check` learns the pub.dev version of `codeality_lints` and
`codeality_dart` and the git tag of `codeality-swift`.

## Stagebeat adoption (the acceptance test)

1. `codeality-dart init --apply --ci` in `apps/mobile` and in
   `packages/click_core`; `codeality-swift init --apply --ci` with roots
   `apps/mobile/ios/Runner`, `apps/mobile/ios/StagebeatWatch`,
   `apps/mobile/macos/Runner`.
2. One mechanical formatting commit for the Swift files
   (`swift format --in-place`), kept separate so it is easy to skip in blame.
   Dart is already formatted.
3. `baseline create` for both tools (structure, analyzer/swiftlint and
   duplicates sections); commit the baselines.
4. Coverage floor set to stagebeat's measured line coverage, rounded down to the
   whole percent (designer's call: a ratchet, not "80% or red"; the 80% default
   applies to new projects and templates).
5. Stagebeat's `ci.yml` keeps a job named `test`, so `build-android`,
   `build-apple` and `build-windows` (all `needs: test`, verified with
   actionlint by the Codex review) keep working, but its steps are replaced by
   `uses: ./.github/workflows/codeality.yml` (designer's call: the gate already
   runs analyze and the tests, and the owner keeps CI minutes down). The
   generated workflow runs the full gate for `apps/mobile`, the full gate for
   `packages/click_core` (not just its `dart test`), and the Swift gate. The
   `lib/domain` import grep becomes an extra step of the `dart-apps-mobile` job,
   unchanged. `actionlint` passes on the result.
6. All three gates pass in stagebeat's CI on Ubuntu, and the run log shows each
   of the three jobs ran every required stage; a manual dispatch of one build
   job still resolves its `needs`.
7. A deliberately added second top-level class in a `lib/` file, a new
   duplicated block, a new analyzer finding, and an unformatted Swift file each
   turn the gate red.
8. Record findings counts per rule and source (before baseline) in stagebeat's
   `TODO.md` as its debt backlog.

**Pinning before pub.dev exists** (designer's call): until the owner's first
manual publish of `codeality_lints` and `codeality_dart`, stagebeat pins both by
git ref — a `git:` dev_dependency with `path:` and `ref: <tag>`, and
`dart pub global activate --source git <repo> --git-path packages/codeality-dart --git-ref <tag>`
in its workflow. `init`, `dart-versions.json` and estate conformance support
only the pub.dev form; stagebeat's git pins are hand-edited and switched to
pub.dev versions right after the first publish. Adoption is not blocked on the
owner.

Commits to stagebeat follow that repository's own rules; pushing there is a
separate authorization from pushing codeality.

## Left to the builder

- The exact strict lint rule list (within the criteria above).
- Internal module layout of both tools (one exported unit per file, as
  everywhere in this repo), test layout (`test/` mirroring `lib/src/`,
  integration tests over fixture projects with known findings).
- Config schema details beyond the keys named here (roots, roles, limits,
  overrides, coverage floor, SQL globs).
- Coverage tooling for pure-Dart projects.
- Caching in the generated CI workflows.

## Open questions

None blocking. Builder calls are marked in the sections above.
