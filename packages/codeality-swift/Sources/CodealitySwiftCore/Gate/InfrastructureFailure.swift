import Foundation

/// A stage that could not run: the tool is missing or crashed.
func infrastructureFailure(_ name: String, _ kind: StageKind, _ run: ToolRun, detail: String? = nil)
    -> StageResult
{
    StageResult(
        name: name, kind: kind, command: run.command, status: .failedToRun,
        exitCode: run.missing ? nil : run.exitCode,
        detail: detail
            ?? (run.missing
                ? "tool not found: \(run.stderr)"
                : "exit \(run.exitCode): \(run.stderr.trimmingCharacters(in: .whitespacesAndNewlines))"))
}
