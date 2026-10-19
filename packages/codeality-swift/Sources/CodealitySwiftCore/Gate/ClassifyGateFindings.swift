/// Tag each finding new or known against the [recorded] multiset.
public func classifyGateFindings(_ findings: [GateFinding], _ recorded: [String: Int])
    -> ClassifiedGateFindings
{
    let counts = classifyFingerprints(findings.map(\.fingerprint), recorded)
    return ClassifiedGateFindings(
        findings: zip(findings, counts.states).map { $0.withBaseline($1) }, counts: counts)
}
