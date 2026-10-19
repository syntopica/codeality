import '../model/gate_finding.dart';

/// The clones jscpd found and the duplicated share of the scanned lines.
final class JscpdReport {
  const JscpdReport({required this.clones, required this.percentage});

  final List<GateFinding> clones;
  final num percentage;
}
