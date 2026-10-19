import '../model/gate_finding.dart';

/// The multiset of fingerprints in [findings].
Map<String, int> gateFindingCounts(List<GateFinding> findings) {
  final counts = <String, int>{};
  for (final finding in findings) {
    counts.update(finding.fingerprint, (n) => n + 1, ifAbsent: () => 1);
  }
  return counts;
}
