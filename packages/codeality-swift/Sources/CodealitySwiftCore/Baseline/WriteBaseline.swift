import Foundation

/// Write [baseline] with sorted keys so the file diffs cleanly.
public func writeBaseline(projectRoot: String, _ baseline: BaselineFile) throws {
  let document: [String: Any] = [
    "schema_version": baseline.schemaVersion,
    "tool_version": packageVersion,
    "sections": baseline.sections,
  ]
  var data = try JSONSerialization.data(
    withJSONObject: document, options: [.prettyPrinted, .sortedKeys])
  data.append(contentsOf: Array("\n".utf8))
  try data.write(
    to: URL(fileURLWithPath: projectRoot).appendingPathComponent(BaselineFile.fileName))
}
