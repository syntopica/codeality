import ArgumentParser
import CodealitySwiftCore

/// `baseline update`: re-record the current debt.
struct BaselineUpdateCommand: AsyncParsableCommand {
  static let configuration = CommandConfiguration(
    commandName: "update", abstract: "Re-record the current debt.")

  @OptionGroup var options: ProjectOptions
  @Option(parsing: .upToNextOption, help: "Sections to record.") var sections: [String] =
    baselineSections

  func run() async throws {
    try await baselineWrite(root: options.root, sections: sections, overwrite: true)
  }
}
