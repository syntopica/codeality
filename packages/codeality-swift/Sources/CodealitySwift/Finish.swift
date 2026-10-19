import ArgumentParser
import CodealitySwiftCore

/// Finish a command with a codeality exit code.
func finish(with code: CodealitySwiftCore.ExitCode) throws {
  if code != .ok { throw ArgumentParser.ExitCode(code.rawValue) }
}
