/// The total plus a per-code count.
func findingsSummary(_ findings: [Finding]) -> [String: Int] {
  findings.reduce(into: ["total": findings.count]) { counts, finding in
    counts[finding.code.code, default: 0] += 1
  }
}
