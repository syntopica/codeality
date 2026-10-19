import '../model/gate_finding.dart';
import 'stage_kind.dart';
import 'stage_status.dart';

/// The outcome of one gate stage.
final class StageResult {
  const StageResult({
    required this.name,
    required this.kind,
    required this.command,
    required this.status,
    this.exitCode,
    this.duration = Duration.zero,
    this.detail = '',
    this.findings = const [],
    this.newCount = 0,
    this.knownCount = 0,
    this.resolvedCount = 0,
  });

  final String name;
  final StageKind kind;
  final String command;
  final StageStatus status;
  final int? exitCode;
  final Duration duration;
  final String detail;
  final List<GateFinding> findings;
  final int newCount;
  final int knownCount;
  final int resolvedCount;

  StageResult withDuration(Duration duration) => StageResult(
    name: name,
    kind: kind,
    command: command,
    status: status,
    exitCode: exitCode,
    duration: duration,
    detail: detail,
    findings: findings,
    newCount: newCount,
    knownCount: knownCount,
    resolvedCount: resolvedCount,
  );
}
