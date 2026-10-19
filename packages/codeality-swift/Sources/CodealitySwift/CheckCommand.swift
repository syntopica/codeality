import ArgumentParser
import CodealitySwiftCore

/// `codeality-swift check`: the structural rules, read-only.
struct CheckCommand: AsyncParsableCommand {
  static let configuration = CommandConfiguration(
    commandName: "check", abstract: "Run the structural rules. Never writes.")

  @OptionGroup var options: ProjectOptions
  @Option(help: "text or json.") var format: String = "text"
  @Flag(help: "Stop at the first file with findings.") var failFast = false
  @Argument(help: "Restrict the report to these files or directories.") var paths: [String] = []

  func validate() throws {
    guard ["text", "json"].contains(format) else { throw ValidationError("--format is text or json") }
  }

  func run() async throws {
    let root = options.root
    let result = try checkProject(
      projectRoot: root, config: try loadConfig(projectRoot: root), only: paths, failFast: failFast)
    print(format == "json" ? renderJsonReport(result) : renderTextReport(result))
    try finish(with: result.findings.isEmpty ? .ok : .findings)
  }
}
