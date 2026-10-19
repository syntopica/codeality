import Foundation

/// Read jscpd's JSON report. jscpd's own `isNew` is ignored: new versus
/// known comes only from the codeality baseline.
public func parseJscpdReport(_ json: String) throws -> JscpdReport {
    guard let document = try JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any]
    else {
        throw InfrastructureError("jscpd report is not an object")
    }
    let clones = (document["duplicates"] as? [[String: Any]] ?? []).map { duplicate -> GateFinding in
        let first = duplicate["firstFile"] as? [String: Any] ?? [:]
        let second = duplicate["secondFile"] as? [String: Any] ?? [:]
        let firstStart = first["startLoc"] as? [String: Any] ?? [:]
        let secondStart = second["startLoc"] as? [String: Any] ?? [:]
        let firstName = first["name"] as? String ?? ""
        let secondName = second["name"] as? String ?? ""
        return GateFinding(
            code: "duplicate",
            message:
                "\(duplicate["lines"] as? Int ?? 0) lines duplicated with \(secondName):\(secondStart["line"] as? Int ?? 0)",
            location: Location(
                firstName, firstStart["line"] as? Int ?? 1, firstStart["column"] as? Int ?? 1),
            fingerprint: cloneFingerprint(firstName, secondName, duplicate["fragment"] as? String ?? ""))
    }
    let total = (document["statistics"] as? [String: Any])?["total"] as? [String: Any]
    return JscpdReport(
        clones: clones, percentage: (total?["percentage"] as? NSNumber)?.doubleValue ?? 0)
}
