/// What identifies [finding] inside its file: nothing for file-level rules,
/// the subject for naming rules, the offending line otherwise.
func fingerprintContext(_ finding: Finding, _ text: String) -> String {
    switch finding.code {
    case .bsw001, .bsw004: ""
    case .bsw002, .bsw003: finding.subject ?? ""
    default: lineContext(text, finding.location.line)
    }
}
