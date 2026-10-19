import ArgumentParser
import CodealitySwiftCore
import Foundation

/// The `codeality-swift` command line.
@main
struct CodealitySwift: AsyncParsableCommand {
  static let configuration = CommandConfiguration(
    commandName: "codeality-swift",
    abstract: "Strict quality gate for Swift sources.",
    version: "codeality-swift \(packageVersion)",
    subcommands: [CheckCommand.self, BaselineCommand.self, GateCommand.self]
  )

  /// ArgumentParser exits 64 on usage errors; the codeality contract is 2.
  static func main() async {
    do {
      var command = try parseAsRoot()
      if var asyncCommand = command as? AsyncParsableCommand {
        try await asyncCommand.run()
      } else {
        try command.run()
      }
    } catch let error as ConfigError {
      FileHandle.standardError.write(Data("configuration error: \(error.message)\n".utf8))
      Foundation.exit(CodealitySwiftCore.ExitCode.configuration.rawValue)
    } catch let error as InfrastructureError {
      FileHandle.standardError.write(Data("infrastructure error: \(error.message)\n".utf8))
      Foundation.exit(CodealitySwiftCore.ExitCode.infrastructure.rawValue)
    } catch {
      let code = exitCode(for: error)
      if code == .success {
        print(fullMessage(for: error))
        Foundation.exit(0)
      }
      FileHandle.standardError.write(Data((fullMessage(for: error) + "\n").utf8))
      Foundation.exit(
        code == .validationFailure
          ? CodealitySwiftCore.ExitCode.configuration.rawValue : code.rawValue
      )
    }
  }
}
