import Foundation

/// A file init owns outright: created when absent, a conflict when it
/// differs from [content].
func planManagedFile(_ path: String, _ content: String) -> PlannedFile {
  guard let existing = try? String(contentsOfFile: path, encoding: .utf8) else {
    return PlannedFile(path: path, disposition: .create, detail: "not present", content: content)
  }
  return existing == content
    ? PlannedFile(path: path, disposition: .unchanged, detail: "current")
    : PlannedFile(
      path: path, disposition: .conflict, detail: "differs; use --force to replace it",
      content: content)
}
