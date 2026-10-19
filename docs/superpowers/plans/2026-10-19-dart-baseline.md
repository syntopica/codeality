# Dart Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `codeality_lints` and `codeality_dart` (CLI `codeality-dart`)
with `check`, `baseline`, `gate` and `init`, two templates, a CI job and a
pub.dev publish workflow.

**Architecture:** A Dart CLI built on `package:analyzer` (`parseString` only),
structured like `packages/codeality-py`: one exported unit per file under
`lib/src/<module>/`, a rule registry, a multiset debt baseline with three
sections, and a gate that shells out to `dart format`, `dart analyze`,
`npx jscpd`, the test runner and `osv-scanner`. A second, dependency-free
package ships the lint set.

**Tech Stack:** Dart 3.13, `analyzer`, `args`, `yaml`, `yaml_edit`, `path`,
`glob`, `crypto`; dev: `test`, `coverage`. jscpd 5.4.1 via npx; osv-scanner.

**Spec:** `docs/superpowers/specs/2026-10-19-dart-swift-baseline-design.md`

## Global Constraints

- Directories `packages/codeality-dart` (pub `codeality_dart`, executable
  `codeality-dart`) and `packages/codeality-dart-lints` (pub `codeality_lints`).
  Both outside the pnpm/turbo workspace.
- `codeality_lints` has **no** dependencies. `codeality_dart` is installed with
  `dart pub global activate`, never as a consumer dependency.
- Rule codes `BDT000`-`BDT007`, slugs exactly as in the spec table. Codes are
  immutable.
- Exit codes: 0 clean, 1 findings, 2 configuration / `init --check` conflict, 3
  infrastructure. A required stage whose tool is missing is 3, never a skip.
- Defaults: `max-file-lines` 150, `test-max-file-lines` 300, coverage floor 80,
  jscpd `minTokens` 70 and `threshold` 1 (from `quality-config/jscpd.json`).
- Text diagnostics: `path:line:col: BDT001 one-primary-unit: <message>`. JSON:
  same top-level shape as `codeality-py` (`schema_version`, `tool`, `roots`,
  `scanned_files`, `findings`, `warnings`, `summary`), on stdout; logs on
  stderr.
- Baseline file `.codeality-dart-baseline.json`: sections `structure`,
  `analyzer`, `duplicates`; each a map fingerprint -> occurrence count; a stage
  fails when any current count exceeds the recorded one.
- Fingerprints never include line numbers (see `codeality_py/baseline`).
- The tool's own source obeys its rules: one top-level declaration per file. It
  runs its own gate in CI.
- All text in English. Commits follow repo style (`feat(codeality-dart): ...`).

## Review Focus

1. A project whose `pubspec.yaml` lacks the roots in config (`bin/` absent, no
   `test/`): traversal skips missing roots with a warning, not a crash.
2. A file with a BOM, CRLF line endings or only comments: line counting and
   parsing stay correct (`BDT004` counts 0 occupied lines for comment-only).
3. A consumer whose `analysis_options.yaml` has no `include:` and uses
   `analyzer: exclude:` with anchors/comments: `init` preserves comments and
   ordering (`yaml_edit`), never rewrites the whole file.
4. `npx` unavailable or offline: duplicates stage reports exit 3 with the
   command and stderr, not a JSON parse exception.
5. A baseline written by a newer schema version: `baseline check` exits 2 with a
   message naming both versions, never silently treats all debt as new.

Each item has its test in the owning task (Tasks 3, 4, 13, 10, 8).

---

### Task 1: Package scaffold and CLI shell

**Files:**

- Create: `packages/codeality-dart/pubspec.yaml`,
  `packages/codeality-dart/analysis_options.yaml`,
  `packages/codeality-dart/bin/codeality_dart.dart`, `lib/src/cli/run_cli.dart`,
  `lib/src/report/exit_code.dart`, `lib/src/version.dart`, `CHANGELOG.md`,
  `README.md`, `.gitignore`
- Test: `packages/codeality-dart/test/cli/run_cli_test.dart`

**Interfaces:**

- Produces:
  `Future<int> runCli(List<String> args, {required IOSink out, required IOSink err})`;
  `enum ExitCode { ok(0), findings(1), configuration(2), infrastructure(3) }`
  with `final int value`; `const String packageVersion = '0.1.0';`

- [ ] **Step 1: Write failing tests**: `--version` prints `codeality-dart 0.1.0`
      and returns 0; an unknown command returns 2 and prints usage to `err`;
      `check`, `baseline`, `gate`, `init` are registered (`--help` lists all
      four).
- [ ] **Step 2: Run** `cd packages/codeality-dart && dart test` - expect FAIL.
- [ ] **Step 3: Implement** with `package:args` `CommandRunner`; subcommands are
      stubs returning 0 until their tasks. `pubspec.yaml`:
      `name:     codeality_dart`, `version: 0.1.0`,
      `executables: {codeality-dart:     codeality_dart}`,
      `environment: sdk: ^3.13.0`, dependencies listed in Tech Stack,
      `repository: https://github.com/syntopica/codeality`. Its own
      `analysis_options.yaml` uses `include: package:lints/recommended.yaml`
      until Task 13 switches it to `codeality_lints` via `path:` dev dependency.
- [ ] **Step 4: Run**
      `dart test && dart analyze --fatal-infos && dart format     --output=none --set-exit-if-changed .` -
      expect PASS.
- [ ] **Step 5: Commit** `feat(codeality-dart): scaffold the CLI`.

### Task 2: Model and configuration

**Files:**

- Create under `lib/src/`: `model/rule_code.dart`, `model/finding.dart`,
  `model/location.dart`, `model/module_role.dart`, `config/dart_config.dart`,
  `config/load_config.dart`, `config/config_error.dart`,
  `config/reject_unknown_keys.dart`, `config/reject_duplicate_role_claims.dart`,
  `config/default_generated_globs.dart`, `assets/codeality_dart_yaml.dart`
  (default config text as a const)
- Test: `test/config/load_config_test.dart`

**Interfaces:**

- Produces:
  `enum RuleCode { bdt000('parse-error'), ..., bdt007('no-hand-written-part') }`
  with `String get code` (`'BDT001'`) and `final String slug`;
  `class Finding { RuleCode code; String message; Location location; String? subject; String fingerprint; String baselineState; }`;
  `class Location { String path; int line; int column; }` (path
  project-relative, POSIX separators);
  `enum ModuleRole { excluded, generated, test, barrel, entrypoint, data, ordinary }`;
  `DartConfig loadConfig(String projectRoot)` throwing `ConfigError`.
- `DartConfig` fields and YAML keys (file `codeality-dart.yaml`):
  `schemaVersion` (`schema-version: 1`), `sourceRoots` (`[lib, bin]`),
  `testRoots` (`[test, integration_test]`), `respectGitignore` (true),
  `coverageThreshold` (80), `testBudgetSeconds` (300), `maxFileLines` /
  `testMaxFileLines` (`limits:`), `roles` (`entrypoint`, `data`, `generated`
  glob lists; defaults `entrypoint: [lib/main.dart, bin/*.dart]`), `sqlGlobs`
  (`['**/*.drift', '**/*.sql']`), `duplicatesMinTokens` / `duplicatesThreshold`
  (nullable, override jscpd defaults), `extraRoots` (nullable).

- [ ] **Step 1: Failing tests**: missing file -> defaults; unknown key
      `limits.max-lines` -> `ConfigError` naming the key; same file claimed by
      `entrypoint` and `data` -> `ConfigError`; `schema-version: 2` ->
      `ConfigError` naming 1 and 2.
- [ ] **Step 2: Run** `dart test test/config` - FAIL.
- [ ] **Step 3: Implement** with `package:yaml`.
- [ ] **Step 4: Run** - PASS.
- [ ] **Step 5: Commit** `feat(codeality-dart): load codeality-dart.yaml`.

### Task 3: Traversal and roles

**Files:**

- Create: `lib/src/traversal/collect_source_files.dart`,
  `traversal/default_excludes.dart` (`.dart_tool`, `build`, `.git`, `ios`,
  `android`, `macos`, `windows`, `linux`, `web`),
  `traversal/gitignore_matcher.dart`, `roles/assign_module_role.dart`,
  `roles/has_generated_marker.dart`, `roles/is_directive_only.dart`
- Test: `test/traversal/collect_source_files_test.dart`,
  `test/roles/assign_module_role_test.dart`

**Interfaces:**

- Consumes: `DartConfig`, `ModuleRole`.
- Produces:
  `List<String> collectSourceFiles(String projectRoot, DartConfig config, {required void Function(String) warn})`
  (sorted project-relative `.dart` paths; does not descend into a directory that
  has its own `pubspec.yaml`);
  `ModuleRole assignModuleRole(String path, CompilationUnit unit, String text, DartConfig config)`.

- [ ] **Step 1: Failing tests** over a temp-dir fixture: nested
      `packages/x/pubspec.yaml` is not traversed; `.gitignore`d file skipped;
      missing `bin/` produces one warning `source root bin does not exist` and
      no exception (Review Focus 1); role precedence `generated` beats `test`
      for `test/foo.mocks.dart`; `// GENERATED CODE - DO NOT MODIFY` in the
      first 5 lines -> `generated`; a file of only `export` directives ->
      `barrel`; `lib/main.dart` -> `entrypoint`.
- [ ] **Step 2: Run** - FAIL. **Step 3: Implement.** **Step 4: Run** - PASS.
- [ ] **Step 5: Commit**
      `feat(codeality-dart): traverse projects and assign roles`.

### Task 4: Parsing, BDT000 and BDT004

**Files:**

- Create: `lib/src/parsing/parse_source_file.dart`, `parsing/source_file.dart`,
  `rules/rule.dart` (abstract interface), `rules/parse_error.dart`,
  `rules/max_file_lines.dart`, `rules/count_code_lines.dart`,
  `engine/rule_registry.dart`
- Test: `test/rules/max_file_lines_test.dart`,
  `test/parsing/parse_source_file_test.dart`

**Interfaces:**

- Produces:
  `class SourceFile { String path; String text; CompilationUnit unit; ModuleRole role; List<AnalysisError> parseErrors; }`;
  `SourceFile parseSourceFile(String projectRoot, String path, DartConfig config)`
  using `parseString(content: text, throwIfDiagnostics: false)`;
  `abstract interface class Rule { RuleCode get code; Iterable<Finding> check(SourceFile file, DartConfig config); }`;
  `List<Rule> ruleRegistry()`; `int countCodeLines(String text)` (non-blank,
  non-comment lines, block comments and `///` included as comments).

- [ ] **Step 1: Failing tests**: unparsable file -> one `BDT000` at the first
      diagnostic's position; 151 occupied lines in `lib/` -> `BDT004`, 150 ->
      none; test role uses 300; a file with BOM + CRLF + only comments counts 0
      (Review Focus 2); `generated` role -> no findings.
- [ ] **Step 2-4: Run / implement / run.**
- [ ] **Step 5: Commit** `feat(codeality-dart): parse files and cap their size`.

### Task 5: BDT001 one-primary-unit and BDT002 file-matches-unit

**Files:**

- Create: `lib/src/units/top_level_units.dart`, `units/unit.dart`,
  `units/is_state_of.dart`, `units/is_extension_on.dart`,
  `rules/one_primary_unit.dart`, `rules/file_matches_unit.dart`,
  `units/snake_case.dart`
- Test: `test/rules/one_primary_unit_test.dart`,
  `test/rules/file_matches_unit_test.dart`

**Interfaces:**

- Produces: `class Unit { String name; AstNode node; bool isPublic; }`;
  `List<Unit> topLevelUnits(CompilationUnit unit)` - groups a `StatefulWidget`
  subclass with one class whose `extends` is `State<ThatName>`, and an extension
  whose `on` type names the primary, into the primary's unit; every other
  top-level declaration (class, mixin, mixin class, enum, extension, extension
  type, typedef, function, getter/setter, each variable in a top-level variable
  list) is its own unit. `String snakeCase(String identifier)` (`_FooBarState`
  -> `foo_bar_state`, `HTTPClient` -> `http_client`).

- [ ] **Step 1: Failing tests**: two public classes -> `BDT001` with both names
      in `message`; widget + `_WidgetState extends State<Widget>` -> no finding;
      widget + a `State<Other>` -> finding; private helper class next to a
      public one -> finding; `extension on Primary` -> no finding; `test` role
      exempt; `foo_bar.dart` holding `class FooBar` -> no `BDT002`, holding
      `class Baz` -> `BDT002` with subject `Baz`; `entrypoint` and `data` exempt
      from `BDT002`; `data` role with a function -> `BDT001`.
- [ ] **Step 2-4.** **Step 5: Commit**
      `feat(codeality-dart): one unit per file, named after it`.

### Task 6: BDT003, BDT005, BDT007

**Files:**

- Create: `rules/no_grab_bag_names.dart`, `rules/grab_bag_names.dart`
  (`{'utils','helpers','misc','common'}`), `rules/barrel_only.dart`,
  `rules/no_hand_written_part.dart`, `roles/is_generated_path.dart`
- Test: one test file per rule under `test/rules/`

- [ ] **Step 1: Failing tests**: `lib/utils/x.dart` and `lib/Helpers.dart` ->
      `BDT003` (case-insensitive, full segment; `lib/utilsx.dart` passes); a
      file with `export` plus a class -> `BDT005`; directives-only file passes;
      `part 'db.g.dart';` passes; `part 'db_extra.dart';` -> `BDT007`; `part of`
      in a non-generated file -> `BDT007`; the stagebeat shape
      (`stagebeat_database.dart` + `part 'stagebeat_database.g.dart';`) passes.
- [ ] **Step 2-4.** **Step 5: Commit**
      `feat(codeality-dart): grab-bag, barrel and part rules`.

### Task 7: BDT006 no-inline-sql

**Files:**

- Create: `rules/no_inline_sql.dart`, `rules/looks_like_sql.dart`,
  `rules/is_column_list.dart`, `rules/string_literal_text.dart`
- Test: `test/rules/no_inline_sql_test.dart`

- [ ] **Step 1: Failing tests** ported from `packages/codeality-py/tests/rules/`
      SQL cases: `'SELECT id, name FROM     songs WHERE id = ?'` -> finding;
      `'Select an option from the menu'` -> none; adjacent-string and multi-line
      `'''` literals are joined before matching; interpolated strings use their
      static parts; drift `customSelect('SELECT ...')` -> finding.
- [ ] **Step 3: Implement** `bool looksLikeSql(String text)` as a port of
      `codeality_py/rules/looks_like_sql.py` (same regexes and column-list
      check).
- [ ] **Step 2/4/5** as usual; commit `feat(codeality-dart): forbid inline SQL`.

### Task 8: check command, reports, multiset baseline

**Files:**

- Create: `engine/check_project.dart`, `engine/check_result.dart`,
  `report/render_text_report.dart`, `report/render_json_report.dart`,
  `report/finding_document.dart`, `baseline/baseline_file.dart`,
  `baseline/read_baseline.dart`, `baseline/write_baseline.dart`,
  `baseline/fingerprint.dart`, `baseline/fingerprint_context.dart`,
  `baseline/classify_findings.dart`, `cli/check_command.dart`,
  `cli/baseline_command.dart`
- Test: `test/engine/check_project_test.dart`,
  `test/baseline/classify_findings_test.dart`,
  `test/baseline/read_baseline_test.dart`, `test/cli/check_command_test.dart`

**Interfaces:**

- Produces: `CheckResult checkProject(String projectRoot, DartConfig config)`;
  `class BaselineFile { int schemaVersion; String toolVersion; Map<String, Map<String,int>> sections; }`
  with section keys `structure`, `analyzer`, `duplicates`;
  `String fingerprint(String section, String code, String path, String context)`
  (sha256, first 16 hex, version-prefixed like `codeality_py`);
  `Classified classifyFindings(List<Finding> current, Map<String,int> recorded)`
  returning `new`, `known`, `resolved` counts and the findings tagged with
  `baselineState`, where for each fingerprint the first `recorded[fp]`
  occurrences are `known` and the rest `new`.
- Fingerprint context per rule: `BDT001`/`BDT004` -> `''`; `BDT002`/`BDT003` ->
  subject; others -> trimmed text of the finding's line.

- [ ] **Step 1: Failing tests**: JSON shape keys match Global Constraints; text
      line format exact; baseline with `{fp: 1}` and two identical findings -> 1
      known, 1 new, exit 1; one finding and `{fp: 2}` -> 1 known, 1 resolved,
      exit 0; schema 2 baseline -> exit 2 naming both versions (Review Focus 5);
      `baseline create` refuses when a file exists (use `update`); `check` never
      writes.
- [ ] **Step 2-4.** **Step 5: Commit**
      `feat(codeality-dart): check command and debt baseline`.

### Task 9: Analyzer stage

**Files:**

- Create: `gate/analyze_stage.dart`, `gate/parse_machine_output.dart`,
  `gate/is_flutter_project.dart`, `gate/analyzer_diagnostic.dart`
- Test: `test/gate/parse_machine_output_test.dart`,
  `test/gate/analyze_stage_test.dart` (integration, tagged `integration`)

**Interfaces:**

- Produces:
  `List<AnalyzerFinding> parseMachineOutput(String stdout, String projectRoot)`
  (record: `severity|type|code|absolute path|line|column|length|message`; `\|`
  escapes respected; paths made project-relative). Analyzer diagnostics are a
  separate
  `class AnalyzerFinding { String severity; String diagnosticCode; String message; Location location; String fingerprint; String baselineState; }`
  in `model/analyzer_finding.dart`, so `RuleCode` stays closed; returns
  `List<AnalyzerFinding>`. `bool isFlutterProject(String projectRoot)` (pubspec
  `dependencies.flutter` has `sdk: flutter`);
  `Future<StageResult> analyzeStage(...)`.
- Command: Flutter -> `flutter pub get` then
  `<flutter sdk>/bin/dart analyze --format=machine --fatal-infos .`; pure Dart
  -> `dart pub get` then `dart analyze --format=machine --fatal-infos .`. Exit
  64 or no parsable output with non-zero exit -> infrastructure.

- [ ] **Step 1: Failing tests**: parse a captured multi-record sample (include a
      message containing `\|`); integration fixture with two identical
      `print(count);` lines yields two records with equal fingerprints; with
      baseline `{fp:1}` the stage reports 1 new.
- [ ] **Step 2-4.** **Step 5: Commit**
      `feat(codeality-dart): analyzer stage with debt baseline`.

### Task 10: Duplicates stage and shared jscpd config

**Files:**

- Modify: `packages/quality-config/jscpd.json` (formats add `dart`, `swift`;
  ignore add `**/*.g.dart`, `**/*.freezed.dart`, `**/.build/**`, `**/build/**`,
  `**/.dart_tool/**`)
- Create: `scripts/sync-jscpd-embeds.mjs` (writes
  `packages/codeality-dart/lib/src/assets/jscpd_defaults.dart` and, later, the
  Swift equivalent; `--check` mode exits 1 on drift); add
  `pnpm sync-jscpd:check` to `check:ci:run`
- Create: `gate/duplicates_stage.dart`, `gate/parse_jscpd_report.dart`,
  `gate/clone_fingerprint.dart`, `assets/jscpd_defaults.dart` (generated)
- Test: `test/gate/parse_jscpd_report_test.dart`,
  `test/gate/duplicates_stage_test.dart` (integration)

**Interfaces:**

- Produces:
  `String cloneFingerprint(String pathA, String pathB, String fragment)` (paths
  sorted, fragment whitespace collapsed);
  `Future<StageResult> duplicatesStage(String projectRoot, DartConfig config, BaselineFile? baseline)`.
- Command:
  `npx --yes jscpd@5.4.1 --format dart --min-tokens <n> --threshold <t> --ignore <globs> --reporters json --output <tmpdir> --silent <roots>`;
  the pin `5.4.1` lives in `jscpd_defaults.dart` and is generated from the root
  `package.json` devDependency. jscpd's `isNew` is ignored.

- [ ] **Step 1: Failing tests**: parse a captured report; same clone with
      swapped file order -> same fingerprint; baseline `{fp:1}` and the same
      fragment duplicated a second time between the same files -> new; without
      baseline, percentage > threshold -> findings; `PATH` without `npx` ->
      infrastructure with the command in the detail (Review Focus 4).
- [ ] **Step 2: Run** `node scripts/sync-jscpd-embeds.mjs --check` fails before
      generation, passes after.
- [ ] **Step 3-4.** **Step 5: Commit**
      `feat(codeality-dart): duplicates stage on the shared jscpd config`.

### Task 11: Format, test/coverage, audit stages and the gate runner

**Files:**

- Create: `gate/stage.dart`, `gate/stage_kind.dart` (`required`, `optional`),
  `gate/stage_status.dart` (`passed`, `findings`, `failedToRun`,
  `skippedNotApplicable`), `gate/stage_result.dart`, `gate/run_stage.dart`,
  `gate/run_gate.dart`, `gate/format_stage.dart`, `gate/structure_stage.dart`,
  `gate/test_stage.dart`, `gate/read_lcov_line_coverage.dart`,
  `gate/audit_stage.dart`, `report/render_gate_report.dart`,
  `cli/gate_command.dart`
- Test: one test per stage builder plus `test/gate/run_gate_test.dart`

**Interfaces:**

- Produces:
  `Future<GateResult> runGate(String projectRoot, DartConfig config, {bool failFast = false})`;
  `double readLcovLineCoverage(String lcovText)` (sum LH / sum LF * 100).
- Stage order: format, analyze, structure, duplicates, test, audit. Test:
  Flutter -> `flutter test --coverage`; pure Dart ->
  `dart test --coverage=coverage` then
  `dart run coverage:format_coverage --lcov --in=coverage --out=coverage/lcov.info --report-on=lib`
  (requires `coverage` as consumer dev dependency; `init` adds it for pure-Dart
  projects). Over `testBudgetSeconds` -> note in report, not failure. Audit:
  `osv-scanner scan --lockfile pubspec.lock`.

- [ ] **Step 1: Failing tests**: a missing required binary -> stage
      `failedToRun`, gate exit 3; findings in one stage do not stop the next
      unless `--fail-fast`; lcov `LF:10 LH:7` -> 70.0, floor 80 -> findings;
      `--json` emits each stage's name, kind, command, duration, status, exit.
- [ ] **Step 2-4.** **Step 5: Commit** `feat(codeality-dart): gate`.

### Task 12: codeality_lints package

**Files:**

- Create: `packages/codeality-dart-lints/pubspec.yaml` (`name: codeality_lints`,
  `version: 0.1.0`, no dependencies), `lib/analysis_options.yaml`,
  `lib/flutter.yaml`, `CHANGELOG.md`, `README.md`, `test_fixtures/flutter_only/`
  and `test_fixtures/pure/` (each a tiny project with a `path:` dev dependency
  on the package), `tool/verify_lints.sh`
- Modify: `packages/codeality-dart/pubspec.yaml` and `analysis_options.yaml` to
  use `codeality_lints` via `path: ../codeality-dart-lints`

- `analysis_options.yaml`: inline the full rule list of `package:lints`
  `recommended.yaml` at the version stagebeat resolves (`lints` 6.x), plus
  `analyzer.language` `strict-casts`/`strict-inference`/`strict-raw-types`, plus
  stagebeat's four rules, plus the strict additions chosen by the builder.
  `flutter.yaml`: same content plus the `flutter_lints` 6.x `flutter.yaml`
  rules, inlined. Header comment records the upstream versions.

- [ ] **Step 1: Write** `tool/verify_lints.sh`: in each fixture run
      `dart     analyze --format=machine`; assert the pure fixture reports
      `prefer_final_locals` and the flutter fixture additionally reports
      `use_key_in_widget_constructors` (Flutter-only rule); exits 1 otherwise.
- [ ] **Step 2: Run** it - FAIL (package empty).
- [ ] **Step 3: Write the two YAML files.**
- [ ] **Step 4: Run** it - PASS;
      `cd packages/codeality-dart && dart analyze     --fatal-infos` still clean
      (fix the tool's own code if the strict set fires).
- [ ] **Step 5: Commit**
      `feat(codeality-lints): shared Dart and Flutter lint set`.

### Task 13: init

**Files:**

- Create: `init/plan_init.dart`, `init/apply_init.dart`,
  `init/plan_disposition.dart` (`create`, `merge`, `conflict`, `unchanged`),
  `init/plan_analysis_options.dart`, `init/plan_pubspec.dart`,
  `init/repository_root.dart`, `init/plan_ci_workflow.dart`,
  `init/project_job_id.dart`, `assets/codeality_ci_workflow.dart`,
  `assets/caller_workflow.dart`, `cli/init_command.dart`
- Test: one test per planner plus `test/cli/init_command_test.dart`

**Interfaces:**

- Produces:
  `List<PlannedFile> planInit(String projectRoot, {required bool ci, required String profile})`;
  `String projectJobId(String repoRoot, String projectRoot)` (`dart-` + relative
  path with `/` and `_` replaced by `-`, e.g. `dart-packages-click-core`); the
  root workflow `.github/workflows/codeality.yml` with
  `on: {workflow_call: {}, workflow_dispatch: {}}`, one job per project, each
  with `working-directory`, `dart pub global activate codeality_dart <version>`
  and `codeality-dart gate`; Flutter jobs use `subosito/flutter-action` pinned
  by SHA (match the repo's action-pin convention), pure Dart jobs
  `dart-lang/setup-dart` pinned by SHA, plus `actions/setup-node` and
  osv-scanner install.

- [ ] **Step 1: Failing tests**: - Flutter project -> include
      `package:codeality_lints/flutter.yaml`; pure ->
      `.../analysis_options.yaml`. - Existing file with comments, `strict-*`
      flags and `include: package:flutter_lints/flutter.yaml` -> `merge`; after
      apply, comments and flags intact, include replaced, `flutter_lints`
      removed from `dev_dependencies`, `codeality_lints` added (Review Focus
      3). - Plan mode writes nothing; `--check` with a conflict -> exit 2;
      `--force` replaces. - `--ci` from `apps/mobile` then from
      `packages/click_core` in one repo -> one root workflow with jobs
      `dart-apps-mobile` and `dart-packages-click-core`; re-run is `unchanged`;
      editing a job then re-running -> `conflict`. - No existing workflow calls
      `codeality.yml` -> a minimal caller `.github/workflows/quality.yml` on
      push and pull_request is planned; when one exists it is left alone and the
      report says how to call it.
- [ ] **Step 2-4.** Run `actionlint` on generated workflows inside the test
      (skip with a clear message if `actionlint` is absent locally; CI has it).
- [ ] **Step 5: Commit** `feat(codeality-dart): init merges config and CI`.

### Task 14: Templates

**Files:**

- Create: `templates/dart-package/` (pubspec with `codeality_lints` path dev dep
  and `coverage`, `lib/<one unit>.dart`, `test/`, `codeality-dart.yaml`,
  `analysis_options.yaml`), `templates/flutter-app/`
  (`flutter create --empty`-shaped, one stateful widget, one widget test)
- Modify: `templates/README.md`

- [ ] **Step 1: Run** `codeality-dart gate` in each template (via
      `dart run     ../../packages/codeality-dart/bin/codeality_dart.dart gate`) -
      FAIL before files exist.
- [ ] **Step 2: Create templates** until both gates pass with 0 findings and
      coverage >= 80.
- [ ] **Step 3: Commit** `feat(templates): Dart package and Flutter app`.

### Task 15: CI, publishing, docs

**Files:**

- Modify: `.github/workflows/ci.yml` (new `dart` job: setup Flutter (pinned),
  setup Node, install osv-scanner; in `packages/codeality-dart`: `dart pub get`,
  `dart format --output=none --set-exit-if-changed .`,
  `dart analyze --fatal-infos`, `dart test`,
  `dart run bin/codeality_dart.dart gate`; run `tool/verify_lints.sh`; gate both
  templates)
- Create: `.github/workflows/publish-dart.yml` (on push tags
  `codeality_lints-v[0-9]+.[0-9]+.[0-9]+` and
  `codeality_dart-v[0-9]+.[0-9]+.[0-9]+`; job `resolve` maps tag prefix to
  directory; job `verify` checks out the tag and runs that package's gate /
  `verify_lints.sh`; job `publish` `needs: verify`,
  `uses: dart-lang/setup-dart/.github/workflows/publish.yml@v1` with
  `environment: pub.dev`, `working-directory` from `resolve`,
  `permissions: id-token: write`)
- Modify: `CLAUDE.md` (section "The Dart packages publish to pub.dev", modelled
  on the PyPI one: tag push trigger, first publish manual by the owner, Admin
  tab settings `syntopica/codeality`, tag pattern `<name>-v{{version}}`,
  environment `pub.dev`, create it with
  `gh api -X PUT repos/syntopica/codeality/environments/pub.dev`)
- Modify: `TODO.md` (item: owner performs first manual `dart pub publish` of
  both packages and enables automated publishing)

- [ ] **Step 1: Run** `actionlint` on both workflows - PASS.
- [ ] **Step 2: Push** and watch `gh run watch` for the `dart` job - green.
- [ ] **Step 3: Commit** `ci(codeality-dart): test, gate and publish workflows`.
