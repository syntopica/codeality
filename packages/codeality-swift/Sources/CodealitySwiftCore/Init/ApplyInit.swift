import Foundation

/// Write creates and merges, and conflicts when [force]d. Returns what was
/// written.
public func applyInit(_ plan: [PlannedFile], force: Bool) throws -> [PlannedFile] {
    var written: [PlannedFile] = []
    for planned in plan {
        let writable =
            planned.disposition == .create || planned.disposition == .merge
            || (force && planned.disposition == .conflict)
        guard let content = planned.content, writable else { continue }
        let url = URL(fileURLWithPath: planned.path)
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        try content.write(to: url, atomically: true, encoding: .utf8)
        written.append(planned)
    }
    return written
}
