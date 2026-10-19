import 'dart:convert';

import 'package:codeality_dart/src/gate/gate_result.dart';
import 'package:codeality_dart/src/gate/stage_kind.dart';
import 'package:codeality_dart/src/gate/stage_result.dart';
import 'package:codeality_dart/src/gate/stage_status.dart';
import 'package:codeality_dart/src/model/gate_finding.dart';
import 'package:codeality_dart/src/model/location.dart';
import 'package:codeality_dart/src/report/render_gate_json.dart';
import 'package:codeality_dart/src/report/render_gate_text.dart';
import 'package:test/test.dart';

final _result = const GateResult([
  StageResult(
    name: 'format',
    kind: StageKind.required,
    command: 'dart format',
    status: StageStatus.passed,
    exitCode: 0,
    duration: Duration(milliseconds: 1500),
  ),
  StageResult(
    name: 'analyze',
    kind: StageKind.required,
    command: 'dart analyze',
    status: StageStatus.findings,
    exitCode: 1,
    newCount: 1,
    knownCount: 2,
    findings: [
      GateFinding(
        code: 'avoid_print',
        message: 'info: no print',
        location: Location('lib/a.dart', 3, 5),
        baselineState: 'new',
      ),
      GateFinding(
        code: 'avoid_print',
        message: 'info: no print',
        location: Location('lib/b.dart', 1, 1),
        baselineState: 'known',
      ),
    ],
  ),
]);

void main() {
  test('text names each stage and prints only new findings', () {
    final text = renderGateText(_result);
    expect(text, contains('passed    format'));
    expect(text, contains('findings  analyze'));
    expect(text, contains('lib/a.dart:3:5: avoid_print: info: no print'));
    expect(text, isNot(contains('lib/b.dart')));
    expect(text, contains('1 new, 2 known'));
    expect(text.trim().split('\n').last, 'gate: findings (exit 1)');
  });

  test('json carries every stage field', () {
    final document =
        jsonDecode(renderGateJson(_result)) as Map<String, Object?>;
    expect(document['exit_code'], 1);
    final stage = (document['stages']! as List).first as Map<String, Object?>;
    expect(
      stage.keys,
      containsAll([
        'name',
        'kind',
        'command',
        'duration_ms',
        'status',
        'exit_code',
        'detail',
        'new',
        'known',
        'resolved',
        'findings',
      ]),
    );
    expect(stage['duration_ms'], 1500);
    expect(stage['status'], 'passed');
  });
}
