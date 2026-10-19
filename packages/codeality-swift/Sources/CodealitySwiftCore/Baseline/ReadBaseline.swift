import Foundation

/// The project's recorded debt, or nil when none is recorded.
public func readBaseline(projectRoot: String) throws -> BaselineFile? {
  let path = URL(fileURLWithPath: projectRoot).appendingPathComponent(BaselineFile.fileName).path
  guard let data = FileManager.default.contents(atPath: path) else { return nil }
  guard let document = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
    throw ConfigError("\(BaselineFile.fileName) is not a JSON object")
  }
  let version = document["schema_version"] as? Int
  guard version == BaselineFile.currentSchemaVersion else {
    throw ConfigError(
      "\(BaselineFile.fileName) has schema_version \(version.map(String.init) ?? "none"); this release "
        + "reads schema_version \(BaselineFile.currentSchemaVersion)")
  }
  guard let sections = document["sections"] as? [String: [String: Int]] else {
    throw ConfigError("\(BaselineFile.fileName) has no \"sections\" object")
  }
  return BaselineFile(toolVersion: document["tool_version"] as? String ?? "", sections: sections)
}
