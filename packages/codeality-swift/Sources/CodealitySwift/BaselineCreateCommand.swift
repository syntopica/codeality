import ArgumentParser
import CodealitySwiftCore

/// `baseline create`: record the current debt; refuses an existing file.
struct BaselineCreateCommand: AsyncParsableCommand {
  static let configuration = CommandConfiguration(
    commandName: "create", abstract: "Record the current debt; refuses when a baseline exists.")

  @OptionGroup var options: ProjectOptions
  @Option(parsing: .upToNextOption, help: "Sections to record.") var sections: [String] = baselineSections

  func run() async throws {
    try await baselineWrite(root: options.root, sections: sections, overwrite: false)
  }
}
