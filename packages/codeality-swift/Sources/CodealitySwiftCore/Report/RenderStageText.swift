import Foundation

/// One stage: a status line, its detail, then each new finding.
func renderStageText(_ stage: StageResult) -> [String] {
    let indent = String(repeating: " ", count: 10)
    var lines = [
        "\(padded(stage.status.rawValue, 9)) \(stage.name) "
            + "(\(String(format: "%.1f", stage.seconds))s) \(stage.command)"
    ]
    if !stage.detail.isEmpty { lines.append(indent + stage.detail) }
    if stage.knownCount > 0 || stage.resolvedCount > 0 {
        lines.append(
            indent + "\(stage.newCount) new, \(stage.knownCount) known, \(stage.resolvedCount) resolved")
    }
    for finding in stage.findings where finding.baselineState == "new" {
        lines.append(
            indent + "\(finding.location.path):\(finding.location.line):\(finding.location.column): "
                + "\(finding.code): \(finding.message)")
    }
    return lines
}
