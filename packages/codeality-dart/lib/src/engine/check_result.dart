import '../model/finding.dart';

/// The outcome of running the structural rules over a project.
final class CheckResult {
  const CheckResult({
    required this.roots,
    required this.scannedFiles,
    required this.findings,
    required this.warnings,
  });

  final List<String> roots;
  final int scannedFiles;
  final List<Finding> findings;
  final List<String> warnings;
}
