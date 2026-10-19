/// Whether a suppression covers [finding]. A parse failure never is: a file
/// that does not parse was not checked.
func isSuppressed(_ finding: Finding, _ suppressions: [Suppression]) -> Bool {
    finding.code != .bsw000
        && suppressions.contains {
            $0.code == finding.code.code && ($0.line == nil || $0.line == finding.location.line)
        }
}
