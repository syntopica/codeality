import Foundation

/// The git root above [projectRoot], or [projectRoot] itself outside git.
func repositoryRoot(_ projectRoot: String) -> String {
    let run = runTool("git", ["rev-parse", "--show-toplevel"], workingDirectory: projectRoot)
    guard run.exitCode == 0 else { return projectRoot }
    return run.stdout.trimmingCharacters(in: .whitespacesAndNewlines)
}
