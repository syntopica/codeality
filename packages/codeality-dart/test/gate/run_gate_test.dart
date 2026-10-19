import 'package:codeality_dart/src/gate/gate_result.dart';
import 'package:codeality_dart/src/gate/run_gate.dart';
import 'package:codeality_dart/src/gate/stage_kind.dart';
import 'package:codeality_dart/src/gate/stage_result.dart';
import 'package:codeality_dart/src/gate/stage_status.dart';
import 'package:test/test.dart';

StageResult _stage(
  String name,
  StageStatus status, [
  StageKind kind = StageKind.required,
]) => StageResult(name: name, kind: kind, command: name, status: status);

void main() {
  Future<GateResult> gate(List<StageStatus> statuses, {bool failFast = false}) {
    final ran = <String>[];
    return runGate([
      for (final (i, status) in statuses.indexed)
        () async {
          ran.add('s$i');
          return _stage('s$i', status);
        },
    ], failFast: failFast);
  }

  test(
    'all stages run by default, findings do not stop the next one',
    () async {
      final result = await gate([StageStatus.findings, StageStatus.passed]);
      expect(result.stages.map((s) => s.name), ['s0', 's1']);
      expect(result.exitCode, 1);
    },
  );

  test('--fail-fast stops at the first stage that did not pass', () async {
    final result = await gate([
      StageStatus.findings,
      StageStatus.passed,
    ], failFast: true);
    expect(result.stages.map((s) => s.name), ['s0']);
  });

  test('a required stage that failed to run exits 3', () async {
    final result = await gate([StageStatus.passed, StageStatus.failedToRun]);
    expect(result.exitCode, 3);
  });

  test('an optional skipped stage does not fail the gate', () async {
    final result = await runGate([
      () async =>
          _stage('opt', StageStatus.skippedNotApplicable, StageKind.optional),
    ]);
    expect(result.exitCode, 0);
  });

  test('every stage records its duration', () async {
    final result = await gate([StageStatus.passed]);
    expect(result.stages.single.duration, isNot(Duration.zero));
  });
}
