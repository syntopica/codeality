# Swift Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `codeality-swift` (`check`, `baseline`, `gate`, `init`), a
template and a Linux CI job.

**Architecture:** A SwiftPM executable on `swift-syntax` (parser only), the same
module shape as `codeality-dart`: config, traversal over plain directories,
roles, rules `BSW000`-`BSW005`, the same multiset baseline format (sections
`structure`, `swiftlint`, `duplicates`), a gate over `swift format lint`,
optional `swiftlint`, structure and jscpd.

**Tech Stack:** Swift 6.x, `swift-syntax` 604.x (`SwiftParser`,
`SwiftParserDiagnostics`), `swift-argument-parser`, `Yams`, `swift-crypto`
(Linux-safe SHA-256). jscpd 5.4.1 via npx.

**Spec:** `docs/superpowers/specs/2026-10-19-dart-swift-baseline-design.md`

**Depends on:** Dart plan Task 10 (`scripts/sync-jscpd-embeds.mjs` and the
`jscpd.json` change) and Task 8 (baseline semantics, mirrored here).

## Global Constraints

- Directory `packages/codeality-swift`, executable `codeality-swift`, tags
  `codeality-swift-v<version>`, starting at `0.1.0`. Not on a registry.
- Builds and runs on Linux and macOS. No Foundation APIs unavailable on Linux.
- Works on plain directories of `.swift` files; never requires `Package.swift`
  in the consumer.
- Rule codes `BSW000`-`BSW005`, slugs as in the spec table.
- Exit codes, text and JSON report shape, baseline multiset semantics,
  fingerprint rules: identical to the Dart plan's Global Constraints, with file
  `.codeality-swift-baseline.json` and config `codeality-swift.yaml`.
- `swift format lint --strict` required; `swiftlint` optional
  (`skippedNotApplicable` when absent).
- One top-level declaration per source file in the tool itself.

## Review Focus

1. Swift files with `#if os(iOS)` / `#if canImport(WatchKit)` blocks: top-level
   declarations inside `#if` clauses are counted once per name, not once per
   clause.
2. A Swift file that parses with recoverable errors (missing brace): `BSW000`
   reported, other rules still run on the recovered tree, no crash.
3. Roots in config that point at an Xcode group containing `.xcassets` and
   `Info.plist`: only `.swift` files are read.
4. `@main struct App: App` plus `#Preview` in the same file (stagebeat's
   `StagebeatWatchApp.swift` shape) passes when configured as `entrypoint`.
5. `swift format` missing from the toolchain (old Swift 5.x on a runner): format
   stage exit 3 naming the Swift version found.

Tests for each are in Tasks 4, 3, 2, 4, 7.

---

### Task 1: Package scaffold and CLI shell

**Files:**

- Create: `packages/codeality-swift/Package.swift` (tools 6.0; products
  executable `codeality-swift` and library `CodealitySwiftCore`; targets
  `CodealitySwift` (main), `CodealitySwiftCore`, test target
  `CodealitySwiftCoreTests`), `Sources/CodealitySwift/CodealitySwift.swift`
  (`@main` `AsyncParsableCommand` with subcommands),
  `Sources/CodealitySwiftCore/Report/ExitCode.swift`,
  `Sources/CodealitySwiftCore/Version.swift`, `CHANGELOG.md`, `README.md`,
  `.gitignore` (`.build/`)
- Modify: root `.gitignore` if needed

**Interfaces:**

- Produces:
  `public enum ExitCode: Int32 { case ok = 0, findings, configuration, infrastructure }`;
  `public let packageVersion = "0.1.0"`.

- [ ] **Step 1: Failing test**: `--version` prints `codeality-swift 0.1.0`;
      unknown subcommand exits 2. Test via `Process` against the built binary in
      `Tests/CodealitySwiftCoreTests/CLITests.swift`.
- [ ] **Step 2: Run** `swift test --package-path packages/codeality-swift` -
      FAIL. **Step 3: Implement.** **Step 4: Run** - PASS.
- [ ] **Step 5: Commit** `feat(codeality-swift): scaffold the CLI`.

### Task 2: Model, config, traversal, roles

**Files:**

- Create in `Sources/CodealitySwiftCore/`: `Model/RuleCode.swift`,
  `Model/Finding.swift`, `Model/Location.swift`, `Model/ModuleRole.swift`
  (`excluded, generated, test, extensionOnly, entrypoint, ordinary`),
  `Config/SwiftConfig.swift`, `Config/LoadConfig.swift`,
  `Config/ConfigError.swift`, `Traversal/CollectSourceFiles.swift`,
  `Roles/AssignModuleRole.swift`, `Roles/IsGeneratedPath.swift`
- Test: matching files under `Tests/CodealitySwiftCoreTests/`

**Interfaces:**

- `SwiftConfig` YAML keys: `schema-version: 1`, `roots` (required, list of
  directories relative to the config file), `test-roots` (default `[]`),
  `limits: {max-file-lines: 150, test-max-file-lines: 300}`,
  `roles: {entrypoint: [], generated: []}` (default generated includes
  `**/GeneratedPluginRegistrant.*`), `exclude` globs,
  `duplicates: {min-tokens, threshold}` optional.
- `func collectSourceFiles(root: String, config: SwiftConfig, warn: (String) -> Void) -> [String]`.

- [ ] **Step 1: Failing tests**: unknown key -> `ConfigError`; missing `roots`
      -> `ConfigError`; a root containing `Assets.xcassets/Contents.json` and
      `Info.plist` yields only `.swift` files (Review Focus 3);
      `GeneratedPluginRegistrant.swift` -> `generated`; `FooTests.swift` ->
      `test`.
- [ ] **Step 2-4.** **Step 5: Commit**
      `feat(codeality-swift): config, traversal, roles`.

### Task 3: Parsing, BSW000, BSW004, BSW003

**Files:**

- Create: `Parsing/ParseSourceFile.swift`, `Parsing/SourceFile.swift`,
  `Rules/Rule.swift` (protocol), `Rules/ParseError.swift`,
  `Rules/MaxFileLines.swift`, `Rules/CountCodeLines.swift`,
  `Rules/NoGrabBagNames.swift`, `Engine/RuleRegistry.swift`

**Interfaces:**

- `public protocol Rule { var code: RuleCode { get }; func check(_ file: SourceFile, _ config: SwiftConfig) -> [Finding] }`;
  `SourceFile` holds path, text, `SourceFileSyntax`, role, and
  `ParseDiagnosticsGenerator.diagnostics(for:)` output.

- [ ] **Step 1: Failing tests**: missing closing brace -> one `BSW000` and
      `BSW004` still evaluated (Review Focus 2); 151 code lines -> `BSW004`;
      `Utils/Foo.swift` and `Helpers.swift` -> `BSW003`; `Utilsx.swift` passes.
- [ ] **Step 2-4.** **Step 5: Commit**
      `feat(codeality-swift): parse, size and naming rules`.

### Task 4: BSW001, BSW002, extension-only role

**Files:**

- Create: `Units/TopLevelUnits.swift`, `Units/Unit.swift`,
  `Units/ExtendedTypeName.swift`, `Rules/OnePrimaryUnit.swift`,
  `Rules/FileMatchesUnit.swift`

**Interfaces:**

- `func topLevelUnits(_ tree: SourceFileSyntax) -> [Unit]` - walks
  `IfConfigDeclSyntax` clauses, de-duplicating by name (Review Focus 1); groups
  extensions of the primary, `#Preview` macro expansions and `PreviewProvider`
  conformers with the primary view.
- `func extendedTypeName(_ ext: ExtensionDeclSyntax) -> String` - last
  component, generic arguments dropped (`Array<Beat>` -> `Array`, `Foo.Bar` ->
  `Bar`).

- [ ] **Step 1: Failing tests**: two structs -> `BSW001`; struct + extension of
      itself -> none; struct + `#Preview` -> none; same `struct X` in
      `#if os(iOS)` and `#else` -> none; extension-only file with two extensions
      of `Beat` named `Beat+Format.swift` -> none; same file named
      `Format.swift` -> `BSW002`; extensions of two different types -> `BSW001`;
      `@main` struct + `#Preview` in an `entrypoint` file -> none (Review Focus
      4); `RemoteView.swift` holding `struct RemoteView` -> none.
- [ ] **Step 2-4.** **Step 5: Commit**
      `feat(codeality-swift): one unit per file`.

### Task 5: BSW005 no-inline-sql

Port `looksLikeSql` from the Dart plan Task 7 (same regexes, same cases),
applied to `StringLiteralExprSyntax` static segments including multi-line `"""`
literals. Files `Rules/NoInlineSql.swift`, `Rules/LooksLikeSql.swift`,
`Rules/IsColumnList.swift`. Tests copied from the Dart task. Commit
`feat(codeality-swift): forbid inline SQL`.

### Task 6: check, reports, baseline

Mirror Dart plan Task 8 exactly (same JSON keys, text format, multiset
classification, schema-version refusal, `baseline create|update|check`), with
sections `structure`, `swiftlint`, `duplicates`. Files under `Engine/`,
`Report/`, `Baseline/`, `Commands/`. Tests: the Dart task's cases translated.
Commit `feat(codeality-swift): check command and debt baseline`.

### Task 7: Gate

**Files:**

- Create: `Gate/Stage.swift`, `Gate/StageResult.swift`, `Gate/RunGate.swift`,
  `Gate/FormatStage.swift`, `Gate/SwiftlintStage.swift`,
  `Gate/StructureStage.swift`, `Gate/DuplicatesStage.swift`,
  `Gate/ParseJscpdReport.swift`, `Gate/CloneFingerprint.swift`,
  `Assets/JscpdDefaults.swift` (generated by `scripts/sync-jscpd-embeds.mjs`;
  extend the script and its `--check`)

- Commands:
  `swift format lint --strict --recursive --configuration <root>/.swift-format <roots>`;
  `swiftlint lint --strict --reporter json --config <root>/.swiftlint.yml <roots>`
  (fingerprint: path, `rule_id`, trimmed line);
  `npx --yes jscpd@5.4.1 --format swift ...` as in the Dart task.

- [ ] **Step 1: Failing tests**: `swift format` absent (simulate with empty
      `PATH` override) -> exit 3 with the found `swift --version` line or "swift
      not found" (Review Focus 5); `swiftlint` absent -> stage
      `skippedNotApplicable`, gate still 0; two identical swiftlint findings vs
      baseline count 1 -> 1 new; jscpd parsing shares the Dart task's fixture.
- [ ] **Step 2-4.** **Step 5: Commit** `feat(codeality-swift): gate`.

### Task 8: init

**Files:**

- Create: `Init/PlanInit.swift`, `Init/ApplyInit.swift`,
  `Init/PlanCiWorkflow.swift`, `Assets/SwiftFormatConfig.swift`,
  `Assets/SwiftlintConfig.swift` (disables `file_length`, `type_body_length`,
  `trailing_comma`, `opening_brace`, `line_length`, and every other rule
  `swift format` already enforces), `Assets/CodealitySwiftYaml.swift`

- `init --ci` merges job id `swift` into the git root's
  `.github/workflows/codeality.yml` with the same merge contract as the Dart
  init (create / unchanged / conflict); the job checks out `syntopica/codeality`
  at `codeality-swift-v<version>`, caches `.build` keyed on `runner.os`,
  `runner.arch`, `swift --version` hash and the tag, and runs
  `swift build -c release` then `codeality-swift gate`.

- [ ] **Step 1: Failing tests**: plan writes nothing; `--apply` creates the
      three config files; existing `.swift-format` that differs -> `conflict`;
      root workflow already holding Dart jobs gains `swift` and keeps them
      byte-identical.
- [ ] **Step 2-4.** **Step 5: Commit** `feat(codeality-swift): init`.

### Task 9: Template and CI

**Files:**

- Create: `templates/swift-package/` (SwiftPM library, one type, one test,
  `codeality-swift.yaml` with `roots: [Sources]`, `test-roots: [Tests]`)
- Modify: `.github/workflows/ci.yml` (job `swift` on `ubuntu-latest` with
  `swift-actions/setup-swift` pinned by SHA to a Swift 6.x toolchain:
  `swift build`, `swift test`, `codeality-swift gate` on itself (roots
  `Sources`, `Tests`) and on the template; cache `.build`)

- [ ] **Step 1: Run** the gate on the template - FAIL before files exist.
- [ ] **Step 2: Create** until gate passes with 0 findings.
- [ ] **Step 3: actionlint**, push, `gh run watch` - `swift` job green on Ubuntu
      (this is the Linux proof the spec requires).
- [ ] **Step 4: Tag** `codeality-swift-v0.1.0` (annotated) once green; push the
      tag.
- [ ] **Step 5: Commit** `ci(codeality-swift): Linux build, tests and gate`.
