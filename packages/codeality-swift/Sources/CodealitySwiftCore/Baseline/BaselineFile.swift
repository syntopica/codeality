/// The recorded debt of one project: per section, fingerprint to count.
public struct BaselineFile: Equatable, Sendable {
  public static let currentSchemaVersion = 1
  public static let fileName = ".codeality-swift-baseline.json"

  public let schemaVersion: Int
  public let toolVersion: String
  public let sections: [String: [String: Int]]

  public init(schemaVersion: Int = currentSchemaVersion, toolVersion: String = "", sections: [String: [String: Int]]) {
    self.schemaVersion = schemaVersion
    self.toolVersion = toolVersion
    self.sections = sections
  }

  public func section(_ name: String) -> [String: Int] { sections[name] ?? [:] }

  public func withSection(_ name: String, _ counts: [String: Int]) -> BaselineFile {
    var updated = sections
    updated[name] = counts
    return BaselineFile(schemaVersion: schemaVersion, toolVersion: toolVersion, sections: updated)
  }
}
