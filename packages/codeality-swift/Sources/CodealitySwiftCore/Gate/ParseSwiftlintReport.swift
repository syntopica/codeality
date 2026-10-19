import Foundation

/// swiftlint's JSON violations as gate findings, fingerprinted by path,
/// rule and the trimmed source line.
public func parseSwiftlintReport(_ json: String, projectRoot: String) throws -> [GateFinding] {
  guard let violations = try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [[String: Any]]
  else {
    throw InfrastructureError("swiftlint report is not a JSON array")
  }
  return violations.map { violation in
    let path = relativePath(violation["file"] as? String ?? "", to: projectRoot)
    let line = violation["line"] as? Int ?? 1
    let rule = violation["rule_id"] as? String ?? "swiftlint"
    let text =
      (try? String(
        contentsOfFile: URL(fileURLWithPath: projectRoot).appendingPathComponent(path).path,
        encoding: .utf8)) ?? ""
    return GateFinding(
      code: rule, message: violation["reason"] as? String ?? "",
      location: Location(path, line, violation["character"] as? Int ?? 1),
      fingerprint: fingerprint(
        section: "swiftlint", code: rule, path: path, context: lineContext(text, line)))
  }
}
