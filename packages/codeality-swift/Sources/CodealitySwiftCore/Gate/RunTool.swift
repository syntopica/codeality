import Foundation

/// Run [executable] from [workingDirectory] and capture its output. A tool
/// that is not on the PATH is reported as missing, never thrown. Output
/// goes through files so a chatty tool cannot fill a pipe and hang.
func runTool(
    _ executable: String, _ arguments: [String], workingDirectory: String,
    environment: [String: String]? = nil
) -> ToolRun {
    let command = ([executable] + arguments).joined(separator: " ")
    let merged = toolEnvironment(environment)
    guard let path = locateExecutable(executable, environment: merged) else {
        return ToolRun(
            command: command, exitCode: -1, stdout: "", stderr: "\(executable) not found", missing: true)
    }
    let scratch = FileManager.default.temporaryDirectory.appendingPathComponent(
        "cs-run-\(UUID().uuidString)")
    try? FileManager.default.createDirectory(at: scratch, withIntermediateDirectories: true)
    defer { try? FileManager.default.removeItem(at: scratch) }
    let outURL = scratch.appendingPathComponent("out")
    let errURL = scratch.appendingPathComponent("err")
    FileManager.default.createFile(atPath: outURL.path, contents: nil)
    FileManager.default.createFile(atPath: errURL.path, contents: nil)
    let process = Process()
    process.executableURL = URL(fileURLWithPath: path)
    process.arguments = arguments
    process.currentDirectoryURL = URL(fileURLWithPath: workingDirectory)
    process.environment = merged
    do {
        process.standardOutput = try FileHandle(forWritingTo: outURL)
        process.standardError = try FileHandle(forWritingTo: errURL)
        try process.run()
    } catch {
        return ToolRun(command: command, exitCode: -1, stdout: "", stderr: "\(error)", missing: true)
    }
    process.waitUntilExit()
    return ToolRun(
        command: command, exitCode: process.terminationStatus,
        stdout: (try? String(contentsOf: outURL, encoding: .utf8)) ?? "",
        stderr: (try? String(contentsOf: errURL, encoding: .utf8)) ?? "")
}
