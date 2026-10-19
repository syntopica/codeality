import ArgumentParser
import CodealitySwiftCore

/// `codeality-swift gate`: every stage, all by default.
struct GateCommand: AsyncParsableCommand {
  static let configuration = CommandConfiguration(
    commandName: "gate", abstract: "Run format, swiftlint, structure and duplicates.")

  @OptionGroup var options: ProjectOptions
  @Flag(help: "Stop at the first failing stage.") var failFast = false
  @Flag(help: "Print the JSON report.") var json = false

  func run() async throws {
    let root = options.root
    let config = try loadConfig(projectRoot: root)
    let result = await runGate(
      defaultGateStages(
        projectRoot: root, config: config, baseline: try readBaseline(projectRoot: root)),
      failFast: failFast)
    print(json ? renderGateJson(result) : renderGateText(result))
    try finish(with: result.exitCode)
  }
}
