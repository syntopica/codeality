import ArgumentParser
import Foundation

/// `--project`, shared by every command.
struct ProjectOptions: ParsableArguments {
  @Option(help: "Project root (default: current directory).")
  var project: String?

  var root: String {
    URL(fileURLWithPath: project ?? FileManager.default.currentDirectoryPath).standardizedFileURL
      .path
  }
}
