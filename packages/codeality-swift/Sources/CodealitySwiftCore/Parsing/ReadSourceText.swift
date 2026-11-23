import Foundation

/// The UTF-8 text of the source file at [url]. A file that cannot be read
/// (permissions, invalid UTF-8) is an infrastructure error, never an empty
/// file: checking it as empty would pass while hiding its findings.
func readSourceText(url: URL, path: String) throws -> String {
  do {
    return try String(contentsOf: url, encoding: .utf8)
  } catch {
    throw InfrastructureError("cannot read \(path): \(error.localizedDescription)")
  }
}
