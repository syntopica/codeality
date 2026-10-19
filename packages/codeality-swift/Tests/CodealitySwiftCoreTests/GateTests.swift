import Foundation
import Testing

@testable import CodealitySwiftCore

private func stage(_ name: String, _ status: StageStatus, _ kind: StageKind = .required)
  -> StageResult
{
  StageResult(name: name, kind: kind, command: name, status: status)
}

@Suite struct GateTests {
  @Test func everyStageRunsAndFindingsDoNotStopTheNext() async {
    let result = await runGate(
      [{ stage("a", .findings) }, { stage("b", .passed) }], failFast: false)
    #expect(result.stages.map(\.name) == ["a", "b"])
    #expect(result.exitCode == .findings)
  }

  @Test func failFastStopsAtTheFirstStageThatDidNotPass() async {
    let result = await runGate(
      [{ stage("a", .findings) }, { stage("b", .passed) }], failFast: true)
    #expect(result.stages.map(\.name) == ["a"])
  }

  @Test func aRequiredStageThatFailedToRunExitsThree() async {
    #expect(
      await runGate([{ stage("a", .failedToRun) }], failFast: false).exitCode == .infrastructure)
  }

  @Test func anOptionalSkippedStageDoesNotFailTheGate() async {
    #expect(
      await runGate([{ stage("a", .skippedNotApplicable, .optional) }], failFast: false).exitCode
        == .ok)
  }

  @Test func withoutSwiftOnThePathTheFormatStageFailsToRunAndSaysSo() async throws {
    let fixture = Fixture()
    fixture.config("roots: [Sources]\n")
    fixture.write("Sources/A.swift", "struct A {}\n")
    let result = await formatStage(
      projectRoot: fixture.root, config: try loadConfig(projectRoot: fixture.root),
      environment: ["PATH": ""])
    #expect(result.status == .failedToRun)
    #expect(result.detail.contains("swift not found"))
  }

  @Test func unformattedCodeIsAFindingNamingTheFile() async throws {
    let fixture = Fixture()
    fixture.config("roots: [Sources]\n")
    fixture.write("Sources/A.swift", "struct  A{}\n")
    let config = try loadConfig(projectRoot: fixture.root)
    let result = await formatStage(projectRoot: fixture.root, config: config)
    #expect(result.status == .findings)
    #expect(result.findings.first?.location.path == "Sources/A.swift")
    fixture.write("Sources/A.swift", "struct A {}\n")
    #expect(await formatStage(projectRoot: fixture.root, config: config).status == .passed)
  }

  @Test func withoutSwiftlintTheStageIsSkippedAndTheGatePasses() async throws {
    let fixture = Fixture()
    fixture.config("roots: [Sources]\n")
    let result = await swiftlintStage(
      projectRoot: fixture.root, config: try loadConfig(projectRoot: fixture.root), baseline: nil,
      environment: ["PATH": ""])
    #expect(result.status == .skippedNotApplicable)
    #expect(await runGate([{ result }], failFast: false).exitCode == .ok)
  }

  @Test func twoIdenticalSwiftlintFindingsAgainstARecordOfOneIsOneNew() throws {
    let fixture = Fixture()
    fixture.write("Sources/A.swift", "let x = 1\nlet x = 1\n")
    let report = """
      [{"file": "\(fixture.root)/Sources/A.swift", "line": 1, "character": 5, "rule_id": "identifier_name",
        "reason": "too short", "severity": "Error"},
       {"file": "\(fixture.root)/Sources/A.swift", "line": 2, "character": 5, "rule_id": "identifier_name",
        "reason": "too short", "severity": "Error"}]
      """
    let findings = try parseSwiftlintReport(report, projectRoot: fixture.root)
    #expect(findings.map(\.location.path) == ["Sources/A.swift", "Sources/A.swift"])
    #expect(findings[0].fingerprint == findings[1].fingerprint)
    let classified = classifyGateFindings(findings, [findings[0].fingerprint: 1])
    #expect(classified.counts.newCount == 1)
  }

  @Test func longStatusNamesAreNotTruncated() {
    let text = renderGateText(GateResult(stages: [stage("lint", .skippedNotApplicable, .optional)]))
    #expect(text.hasPrefix("skippedNotApplicable lint"))
  }
}
