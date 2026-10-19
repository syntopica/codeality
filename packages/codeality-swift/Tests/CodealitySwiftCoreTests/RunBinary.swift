import Foundation

/// Run the built `codeality-swift` binary and capture its exit status and
/// output.
func runBinary(_ arguments: [String], in directory: String? = nil) throws -> (
    status: Int32, stdout: String, stderr: String
) {
    let packageRoot = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
    let process = Process()
    process.executableURL = packageRoot.appendingPathComponent(".build/debug/codeality-swift")
    process.arguments = arguments
    if let directory { process.currentDirectoryURL = URL(fileURLWithPath: directory) }
    let out = Pipe()
    let err = Pipe()
    process.standardOutput = out
    process.standardError = err
    try process.run()
    let stdout = out.fileHandleForReading.readDataToEndOfFile()
    let stderr = err.fileHandleForReading.readDataToEndOfFile()
    process.waitUntilExit()
    return (
        process.terminationStatus,
        String(decoding: stdout, as: UTF8.self),
        String(decoding: stderr, as: UTF8.self)
    )
}
