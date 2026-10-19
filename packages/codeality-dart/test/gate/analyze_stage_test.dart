@Tags(['integration'])
library;

import 'dart:io';

import 'package:codeality_dart/src/baseline/baseline_file.dart';
import 'package:codeality_dart/src/gate/analyze_stage.dart';
import 'package:codeality_dart/src/gate/stage_status.dart';
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
    project = Directory.systemTemp.createTempSync('cd-analyze-');
    write('pubspec.yaml', 'name: fixture\nenvironment:\n  sdk: ^3.13.0\n');
    write('analysis_options.yaml', 'linter:\n  rules:\n    - avoid_print\n');
    write(
      'bin/fixture.dart',
      'void main() {\n  const count = 1;\n  print(count);\n  print(count);\n}\n',
    );
  });
  tearDown(() => project.deleteSync(recursive: true));

  test(
    'identical diagnostics share a fingerprint and count separately',
    () async {
      final result = await analyzeStage(project.path, null);
      expect(result.status, StageStatus.findings);
      expect(result.findings, hasLength(2));
      expect(
        result.findings.first.fingerprint,
        result.findings.last.fingerprint,
      );
    },
  );

  test('a baseline with one recorded copy leaves the second one new', () async {
    final first = await analyzeStage(project.path, null);
    final baseline = BaselineFile(
      sections: {
        'analyzer': {first.findings.first.fingerprint: 1},
      },
    );
    final result = await analyzeStage(project.path, baseline);
    expect(result.status, StageStatus.findings);
    expect(result.newCount, 1);
    expect(result.knownCount, 1);
  });

  test('a clean project passes', () async {
    write('bin/fixture.dart', 'void main() {}\n');
    final result = await analyzeStage(project.path, null);
    expect(result.status, StageStatus.passed);
  });
}
