import 'gate_result.dart';
import 'gate_stage.dart';
import 'stage_result.dart';
import 'stage_status.dart';

/// Run [stages] in order, timing each. Every stage runs unless [failFast],
/// which stops at the first stage that did not pass.
Future<GateResult> runGate(
  List<GateStage> stages, {
  bool failFast = false,
}) async {
  final results = <StageResult>[];
  for (final stage in stages) {
    final watch = Stopwatch()..start();
    final result = (await stage()).withDuration(
      watch.elapsed + const Duration(microseconds: 1),
    );
    results.add(result);
    final stopped =
        result.status == StageStatus.findings ||
        result.status == StageStatus.failedToRun;
    if (failFast && stopped) break;
  }
  return GateResult(results);
}
