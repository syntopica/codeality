@Tags(['integration'])
library;

import 'dart:io';

import 'package:codeality_dart/src/config/load_config.dart';
import 'package:codeality_dart/src/gate/stage_status.dart';
import 'package:codeality_dart/src/gate/test_stage.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

void main() {
  late Directory project;

  void write(String relative, String text) {
    final file = File(p.join(project.path, relative));
    file.parent.createSync(recursive: true);
    file.writeAsStringSync(text);
  }

  setUp(() {
    project = Directory.systemTemp.createTempSync('cd-test-stage-');
    write('pubspec.yaml', '''
name: fixture
environment:
  sdk: ^3.13.0
dev_dependencies:
  test: any
''');
    write(
      'lib/half.dart',
      'int half(int x) => x ~/ 2;\nint unused(int x) {\n  return x;\n}\n',
    );
    write('test/half_test.dart', '''
import 'package:fixture/half.dart';
import 'package:test/test.dart';

void main() => test('half', () => expect(half(4), 2));
''');
    Process.runSync('dart', [
      'pub',
      'get',
      '--offline',
    ], workingDirectory: project.path);
  });
  tearDown(() => project.deleteSync(recursive: true));

  test('coverage under the floor is a finding stating both numbers', () async {
    final result = await testStage(project.path, loadConfig(project.path));
    expect(result.status, StageStatus.findings);
    expect(result.detail, contains('below the floor of 80'));
  });

  test('a lowered floor passes', () async {
    write('codeality-dart.yaml', 'coverage-threshold: 10\n');
    final result = await testStage(project.path, loadConfig(project.path));
    expect(result.status, StageStatus.passed, reason: result.detail);
  });

  test('a failing test is a finding', () async {
    write('test/half_test.dart', '''
import 'package:fixture/half.dart';
import 'package:test/test.dart';

void main() => test('half', () => expect(half(4), 3));
''');
    final result = await testStage(project.path, loadConfig(project.path));
    expect(result.status, StageStatus.findings);
    expect(result.detail, contains('tests failed'));
  });
}
