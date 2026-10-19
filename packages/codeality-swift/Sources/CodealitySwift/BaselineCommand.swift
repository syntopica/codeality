import ArgumentParser

/// `codeality-swift baseline create|update|check`.
struct BaselineCommand: AsyncParsableCommand {
  static let configuration = CommandConfiguration(
    commandName: "baseline", abstract: "Record and compare the debt baseline.",
    subcommands: [BaselineCreateCommand.self, BaselineUpdateCommand.self, BaselineCheckCommand.self])
}
