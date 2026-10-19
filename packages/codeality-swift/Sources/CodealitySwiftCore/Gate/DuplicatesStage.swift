import Foundation

/// jscpd over the roots. With a `duplicates` baseline section the stage
/// fails on any new clone; without one, on the percentage threshold.
public func duplicatesStage(
  projectRoot: String, config: SwiftConfig, baseline: BaselineFile?,
  environment: [String: String]? = nil
) async -> StageResult {
  let name = "duplicates"
  let scratch = FileManager.default.temporaryDirectory.appendingPathComponent(
    "codeality-jscpd-\(UUID().uuidString)")
  try? FileManager.default.createDirectory(at: scratch, withIntermediateDirectories: true)
  defer { try? FileManager.default.removeItem(at: scratch) }
  let configURL = scratch.appendingPathComponent("jscpd.json")
  let configData = try? JSONSerialization.data(
    withJSONObject: jscpdConfig(config, outputDirectory: scratch.path))
  try? configData?.write(to: configURL)
  let run = runTool(
    "npx",
    ["--yes", "jscpd@\(JscpdDefaults.version)", "--config", configURL.path]
      + existingRoots(projectRoot, config),
    workingDirectory: projectRoot, environment: environment)
  let reportPath = scratch.appendingPathComponent("jscpd-report.json").path
  guard !run.missing, let text = try? String(contentsOfFile: reportPath, encoding: .utf8),
    let report = try? parseJscpdReport(text, projectRoot: projectRoot)
  else { return infrastructureFailure(name, .required, run) }
  let section = baseline?.sections["duplicates"]
  let classified = classifyGateFindings(report.clones, section ?? [:])
  let failed =
    section == nil
    ? report.percentage > (config.duplicatesThreshold ?? JscpdDefaults.threshold)
    : classified.counts.newCount > 0
  return StageResult(
    name: name, kind: .required, command: run.command, status: failed ? .findings : .passed,
    exitCode: run.exitCode, detail: String(format: "%.2f%% duplicated", report.percentage),
    findings: classified.findings, newCount: classified.counts.newCount,
    knownCount: classified.counts.knownCount, resolvedCount: classified.counts.resolvedCount)
}
