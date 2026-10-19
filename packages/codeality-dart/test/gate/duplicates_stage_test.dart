@Tags(['integration'])
library;

import 'dart:io';

import 'package:codeality_dart/src/baseline/baseline_file.dart';
import 'package:codeality_dart/src/config/load_config.dart';
import 'package:codeality_dart/src/gate/duplicates_stage.dart';
import 'package:codeality_dart/src/gate/stage_status.dart';
import 'package:path/path.dart' as p;
import 'package:test/test.dart';

const _block = '''
int score(List<int> values) {
  var total = 0;
  for (final value in values) {
    if (value > 10) {
      total += value * 2;
    } else if (value > 5) {
      total += value + 3;
    } else {
      total -= value;
    }
  }
  return total + values.length * 7 - values.first;
}
''';

void main() {
  late Directory project;

  void write(String relative, String text) {
    final file = File(p.join(project.path, relative));
    file.parent.createSync(recursive: true);
    file.writeAsStringSync(text);
  }

  setUp(() {
    project = Directory.systemTemp.createTempSync('cd-dupes-');
    write('pubspec.yaml', 'name: fixture\n');
    write('lib/a.dart', _block);
    write('lib/b.dart', _block.replaceFirst('score', 'rank'));
  });
  tearDown(() => project.deleteSync(recursive: true));

  test(
    'without a baseline, duplication over the threshold is a finding',
    () async {
      final result = await duplicatesStage(
        project.path,
        loadConfig(project.path),
        null,
      );
      expect(result.status, StageStatus.findings);
      expect(result.findings, isNotEmpty);
    },
  );

  test('a recorded clone passes; another copy of it between the same files is new', () async {
    final first = await duplicatesStage(
      project.path,
      loadConfig(project.path),
      null,
    );
    final baseline = BaselineFile(
      sections: {
        'duplicates': {for (final f in first.findings) f.fingerprint: 1},
      },
    );
    final known = await duplicatesStage(
      project.path,
      loadConfig(project.path),
      baseline,
    );
    expect(known.status, StageStatus.passed);
    write('lib/a.dart', '$_block\n${_block.replaceFirst('score', 'again')}');
    write(
      'lib/b.dart',
      '${_block.replaceFirst('score', 'rank')}\n${_block.replaceFirst('score', 'more')}',
    );
    final grown = await duplicatesStage(
      project.path,
      loadConfig(project.path),
      baseline,
    );
    expect(grown.status, StageStatus.findings);
    expect(grown.newCount, greaterThan(0));
  });

  test(
    'without npx on PATH the stage fails to run and names the command',
    () async {
      final result = await duplicatesStage(
        project.path,
        loadConfig(project.path),
        null,
        environment: const {'PATH': ''},
      );
      expect(result.status, StageStatus.failedToRun);
      expect(result.command, contains('jscpd@5.4.1'));
    },
  );
}
