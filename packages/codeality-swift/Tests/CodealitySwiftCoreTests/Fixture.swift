import Foundation

/// A throwaway project directory for tests.
final class Fixture {
  let root: String

  init() {
    root =
      FileManager.default.temporaryDirectory
      .appendingPathComponent("cs-fixture-\(UUID().uuidString)").path
    try? FileManager.default.createDirectory(atPath: root, withIntermediateDirectories: true)
  }

  deinit { try? FileManager.default.removeItem(atPath: root) }

  func write(_ relative: String, _ text: String) {
    let url = URL(fileURLWithPath: root).appendingPathComponent(relative)
    try? FileManager.default.createDirectory(
      at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
    try? text.write(to: url, atomically: true, encoding: .utf8)
  }

  func config(_ yaml: String) { write("codeality-swift.yaml", yaml) }
}
