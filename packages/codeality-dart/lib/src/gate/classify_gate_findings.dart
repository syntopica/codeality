import '../baseline/classified_fingerprints.dart';
import '../baseline/classify_fingerprints.dart';
import '../model/gate_finding.dart';

/// Tag each finding new or known against the [recorded] multiset.
({List<GateFinding> findings, ClassifiedFingerprints counts})
classifyGateFindings(List<GateFinding> findings, Map<String, int> recorded) {
  final counts = classifyFingerprints([
    for (final finding in findings) finding.fingerprint,
  ], recorded);
  return (
    findings: [
      for (var i = 0; i < findings.length; i++)
        findings[i].withBaseline(findings[i].fingerprint, counts.states[i]),
    ],
    counts: counts,
  );
}
