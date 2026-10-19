import '../report/exit_code.dart';
import 'stage_kind.dart';
import 'stage_result.dart';
import 'stage_status.dart';

/// Every stage that ran, and the exit code they add up to.
final class GateResult {
  const GateResult(this.stages);

  final List<StageResult> stages;

  /// A required stage that could not run is 3, never a skip; any findings
  /// are 1; otherwise 0.
  int get exitCode {
    if (stages.any(
      (s) =>
          s.kind == StageKind.required && s.status == StageStatus.failedToRun,
    )) {
      return ExitCode.infrastructure.value;
    }
    if (stages.any((s) => s.status == StageStatus.findings)) {
      return ExitCode.findings.value;
    }
    return ExitCode.ok.value;
  }
}
