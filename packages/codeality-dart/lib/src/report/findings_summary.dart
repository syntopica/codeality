import '../model/finding.dart';

/// The total plus a per-code count, in code order.
Map<String, int> findingsSummary(List<Finding> findings) {
  final counts = <String, int>{};
  for (final finding in findings) {
    counts.update(finding.code.code, (n) => n + 1, ifAbsent: () => 1);
  }
  return {
    'total': findings.length,
    for (final code in counts.keys.toList()..sort()) code: counts[code]!,
  };
}
