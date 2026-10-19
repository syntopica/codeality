/// `swift format lint --strict` over the roots. A toolchain without
/// `swift format` (Swift 5.x) cannot run the stage and says which it is.
public func formatStage(
    projectRoot: String, config: SwiftConfig, environment: [String: String]? = nil
) async
    -> StageResult
{
    let name = "format"
    let probe = runTool(
        "swift", ["format", "--version"], workingDirectory: projectRoot, environment: environment)
    if probe.missing {
        return infrastructureFailure(name, .required, probe, detail: "swift not found on PATH")
    }
    if probe.exitCode != 0 {
        let version = runTool(
            "swift", ["--version"], workingDirectory: projectRoot, environment: environment)
        let found = version.stdout.split(separator: "\n").first.map(String.init) ?? "unknown"
        return infrastructureFailure(
            name, .required, probe, detail: "swift format is unavailable in \(found)")
    }
    let run = runTool(
        "swift",
        ["format", "lint", "--strict", "--recursive"]
            + configFileArguments(projectRoot, "--configuration", ".swift-format")
            + existingRoots(projectRoot, config),
        workingDirectory: projectRoot, environment: environment)
    guard run.exitCode == 0 || run.exitCode == 1 else {
        return infrastructureFailure(name, .required, run)
    }
    let findings = (run.stdout + "\n" + run.stderr).split(separator: "\n").compactMap {
        line -> GateFinding? in
        guard let match = line.wholeMatch(of: diagnosticLinePattern) else { return nil }
        return GateFinding(
            code: "format", message: String(match.message),
            location: Location(String(match.path), Int(match.line) ?? 1, Int(match.column) ?? 1))
    }
    return StageResult(
        name: name, kind: .required, command: run.command,
        status: run.exitCode == 0 ? .passed : .findings,
        exitCode: run.exitCode, findings: findings, newCount: findings.count)
}
