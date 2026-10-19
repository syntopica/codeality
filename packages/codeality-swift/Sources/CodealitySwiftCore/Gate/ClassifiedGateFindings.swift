/// Gate findings tagged new or known, with the counts.
public struct ClassifiedGateFindings: Sendable {
  public let findings: [GateFinding]
  public let counts: ClassifiedFingerprints
}
