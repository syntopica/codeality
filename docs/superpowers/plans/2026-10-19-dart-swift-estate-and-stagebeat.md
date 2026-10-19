# Dart/Swift Estate Integration and Stagebeat Adoption Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `baseline-estate` and `release:check` aware of Dart and Swift
consumers, then adopt both tools in `~/p/stagebeat` as the acceptance test.

**Architecture:** Follow `packages/create-baseline/bin/python/` and
`estate/findPythonConsumers.mjs` one-to-one. Adoption runs the released tools'
`init`, a Swift format commit, baselines, and rewires stagebeat CI through the
root `codeality.yml`.

**Tech Stack:** Node ESM (`.mjs`) as in `create-baseline`; the two CLIs.

**Spec:** `docs/superpowers/specs/2026-10-19-dart-swift-baseline-design.md`

**Depends on:** Dart plan complete; Swift plan complete and tagged.

## Global Constraints

- Conformance findings prefixed `dart-` / `swift-`; shared checks keep their ids
  (`action-pin:*`).
- Version pins in `packages/create-baseline/bin/dart-versions.json`
  (`{"codeality_dart": "...", "codeality_lints": "..."}`) and
  `swift-versions.json` (`{"codeality-swift": "..."}`).
- `init` and conformance accept only pub.dev pins; stagebeat's git-ref pins are
  temporary and hand-edited.
- Stagebeat commits follow stagebeat's own rules and `AGENTS.md`; pushing
  stagebeat needs its own authorization, separate from codeality.
- Every new `.mjs` file holds one exported function.

## Review Focus

1. A pubspec with `codeality_lints` under `dependencies` instead of
   `dev_dependencies`: estate still lists it and conformance flags
   `dart-lints-not-dev-dependency`.
2. A monorepo with three pubspec projects but one root `codeality.yml` missing
   one job: conformance flags `dart-gate-job-missing` naming the project.
3. Git-ref pin in a consumer: conformance reports `dart-pin-not-released` (not a
   crash parsing a non-semver).
4. Stagebeat's manual `workflow_dispatch` build jobs: `needs: test` still
   resolves after rewiring (actionlint clean).
5. Re-running `init --ci` in stagebeat after adoption: zero changes.

Tests for 1-3 in Task 1; 4-5 in Task 3.

---

### Task 1: Estate discovery and conformance

**Files:**

- Create: `packages/create-baseline/bin/estate/findDartConsumers.mjs`,
  `estate/findSwiftConsumers.mjs`, `estate/formatDartEstate.mjs`,
  `estate/formatSwiftEstate.mjs`, `bin/dart/loadDartContext.mjs`,
  `dart/checkLintsDependency.mjs`, `dart/checkGateJobs.mjs`,
  `dart/checkDartPins.mjs`, `dart/runDartConformance.mjs`,
  `bin/swift/loadSwiftContext.mjs`, `swift/checkSwiftGateJob.mjs`,
  `swift/checkSwiftPin.mjs`, `swift/runSwiftConformance.mjs`,
  `bin/dart-versions.json`, `bin/swift-versions.json`
- Modify: `bin/baseline-estate.mjs` (two more tables), and its tests
- Test: alongside the existing create-baseline tests, one per new file, with
  fixture repos under the existing fixtures directory

**Interfaces:**

- `findDartConsumers(root, {maxDepth = 3}) -> Promise<string[]>` (dirs whose
  `pubspec.yaml` names `codeality_lints` in `dev_dependencies` or
  `dependencies`); `findSwiftConsumers(root, {maxDepth = 3})` (dirs with
  `codeality-swift.yaml`);
  `runDartConformance(projectDir, versions) -> {context, findings}`;
  `runSwiftConformance(configDir, versions)`.

- [ ] **Step 1: Failing tests** for Review Focus 1-3, plus: correct pins and a
      root workflow job for the project -> no findings.
- [ ] **Step 2: Run** `pnpm --filter create-baseline test` - FAIL.
- [ ] **Step 3: Implement.** **Step 4: Run** - PASS; `pnpm check:ci` green.
- [ ] **Step 5: Commit** `feat(create-baseline): Dart and Swift estate tables`.

### Task 2: release:check

**Files:**

- Modify: `scripts/release-check.mjs` (read
  `packages/codeality-dart*/pubspec.yaml` versions; check tag
  `<name>-v<version>`, pub.dev `https://pub.dev/api/packages/<name>` lists the
  version, and a `## <version>` CHANGELOG heading; for
  `packages/codeality-swift` check tag `codeality-swift-v<version>` and
  CHANGELOG only)

- [ ] **Step 1:** Run `pnpm release:check --no-npm` - Dart/Swift rows absent.
- [ ] **Step 2: Implement**, keeping the `--no-npm` flag skipping pub.dev too.
- [ ] **Step 3: Run** - rows present; unpublished pub.dev packages reported as
      missing, which is correct until the owner's first publish.
- [ ] **Step 4: Commit** `build: release:check covers Dart and Swift packages`.

### Task 3: Stagebeat adoption

Work in `~/p/stagebeat` on `main`. Pins are git refs until pub.dev exists.

- [ ] **Step 1: Record pre-adoption counts.** Run
      `codeality-dart check     --format json` in `apps/mobile` and
      `packages/click_core`, and `codeality-swift check --format json`; save
      per-rule counts (structure, analyzer with the new lint set, duplicates)
      for Step 8.
- [ ] **Step 2: init.** `codeality-dart init --apply --ci` in both Dart
      projects; `codeality-swift init --apply --ci` with
      `roots:     [apps/mobile/ios/Runner, apps/mobile/ios/StagebeatWatch,     apps/mobile/macos/Runner]`,
      `entrypoint:     [apps/mobile/ios/StagebeatWatch/StagebeatWatchApp.swift,     apps/mobile/ios/Runner/AppDelegate.swift,     apps/mobile/macos/Runner/AppDelegate.swift]`.
      Hand-edit pins to git refs
      (`codeality_lints: {git: {url: https://github.com/syntopica/codeality,     path: packages/codeality-dart-lints, ref: codeality_lints-v0.1.0}}`
      and
      `dart pub global activate --source git ... --git-path     packages/codeality-dart --git-ref codeality_dart-v0.1.0`).
      Run `flutter     pub get` / `dart pub get`. Commit
      `chore: adopt codeality-dart and     codeality-swift`.
- [ ] **Step 3: Swift format commit.**
      `swift format --in-place --recursive     --configuration .swift-format <roots>`;
      build the iOS and macOS targets locally (`flutter build macos --debug`) to
      confirm no behavior change. Commit `style(swift): apply swift format`.
- [ ] **Step 4: Baselines and coverage floor.** `baseline create` in each
      project; set `coverage-threshold` in `apps/mobile/codeality-dart.yaml` to
      the measured line coverage floored to an integer (and likewise for
      `click_core`). Commit `chore: record codeality debt baselines`.
- [ ] **Step 5: Rewire CI.** In `.github/workflows/ci.yml`, replace the `test`
      job's steps with `uses: ./.github/workflows/codeality.yml` (keep the job
      id `test`). Move the `lib/domain` import grep, unchanged, into a new
      `domain-imports` job in `ci.yml` (not into the generated workflow, where
      `init` would report the edit as a conflict), and make the build jobs
      `needs: [test, domain-imports]`. Run `actionlint` - clean (Review Focus
      4). Re-run both `init --ci --check` - exit 0, no changes (Review Focus 5).
      Commit `ci: run the codeality gates`.
- [ ] **Step 6: Prove red.** On a scratch branch locally (not pushed): add a
      second top-level class to a `lib/` file, duplicate a 20-line block, add a
      `print()` in `lib/`, and break formatting in one Swift file; each must
      make its gate exit 1. Revert.
- [ ] **Step 7: Push and watch** (after confirming push authorization for
      stagebeat): `gh run watch` - `dart-apps-mobile`,
      `dart-packages-click-core` and `swift` green, each log showing every
      required stage; `gh workflow run ci.yml` dispatch of one build job
      resolves its `needs`.
- [ ] **Step 8: Debt backlog.** Add to stagebeat `TODO.md` one item per rule
      with its count from Step 1, via `tadu`; run `tadu doctor .`. Commit
      `docs(todo): codeality debt backlog`.
- [ ] **Step 9: After the owner's first pub.dev publish**, switch pins to
      pub.dev versions and confirm `pnpm estate` in codeality lists stagebeat in
      both tables with no conformance findings.
