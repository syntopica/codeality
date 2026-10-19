/// `   create  .swift-format  (not present)`, the path relative to the
/// project when inside it.
public func renderPlannedFile(_ planned: PlannedFile, projectRoot: String) -> String {
  let shown = relativePath(planned.path, to: projectRoot)
  return String(repeating: " ", count: max(0, 9 - planned.disposition.rawValue.count))
    + "\(planned.disposition.rawValue)  \(shown)  (\(planned.detail))"
}
