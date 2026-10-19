/// `path:line:col: BSW001 one-primary-unit: message`.
public func renderFindingLine(_ finding: Finding) -> String {
    "\(finding.location.path):\(finding.location.line):\(finding.location.column): "
        + "\(finding.code.code) \(finding.code.slug): \(finding.message)"
}
