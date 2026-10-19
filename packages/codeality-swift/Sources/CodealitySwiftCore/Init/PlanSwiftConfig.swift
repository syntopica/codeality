import Foundation

/// `codeality-swift.yaml` is the project's own: written once, never replaced.
func planSwiftConfig(_ path: String, _ content: String) -> PlannedFile {
  FileManager.default.fileExists(atPath: path)
    ? PlannedFile(path: path, disposition: .unchanged, detail: "project-owned; never replaced")
    : PlannedFile(path: path, disposition: .create, detail: "not present", content: content)
}
