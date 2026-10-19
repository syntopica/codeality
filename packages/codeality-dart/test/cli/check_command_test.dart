import 'dart:convert';
import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:test/test.dart';

import '../support/run_cli_capture.dart';

void main() {
  late Directory project;

  void write(String relative, String text) {
    final file = File(p.join(project.path, relative));
    file.parent.createSync(recursive: true);
    file.writeAsStringSync(text);
  }

  setUp(() {
    project = Directory.systemTemp.createTempSync('cd-check-');
    write('pubspec.yaml', 'name: fixture\n');
    write('lib/a.dart', 'class A {}\nclass B {}\n');
    write('lib/good.dart', 'class Good {}\n');
  });
  tearDown(() => project.deleteSync(recursive: true));

  test('text output is one line per finding plus a summary', () async {
    final (code, out, _) = await runCliCapture([
      'check',
      '--project',
      project.path,
    ]);
    expect(code, 1);
    final lines = out.trim().split('\n');
    expect(
      lines.first,
      startsWith('lib/a.dart:1:1: BDT001 one-primary-unit: '),
    );
    expect(lines.last, contains('1 findings in 2 files'));
  });

  test('json output has the frozen top-level shape', () async {
    final (code, out, _) = await runCliCapture([
      'check',
      '--project',
      project.path,
      '--format',
      'json',
    ]);
    expect(code, 1);
    final document = jsonDecode(out) as Map<String, Object?>;
    expect(document.keys, [
      'schema_version',
      'tool',
      'roots',
      'scanned_files',
      'findings',
      'warnings',
      'summary',
    ]);
    final finding = (document['findings']! as List).single as Map;
    expect(finding['code'], 'BDT001');
    expect(finding['slug'], 'one-primary-unit');
    expect(finding['fingerprint'], hasLength(16));
    expect((document['summary']! as Map)['total'], 1);
  });

  test('a clean project exits 0', () async {
    File(p.join(project.path, 'lib/a.dart')).deleteSync();
    final (code, _, _) = await runCliCapture([
      'check',
      '--project',
      project.path,
    ]);
    expect(code, 0);
  });

  test('check never writes a baseline', () async {
    await runCliCapture(['check', '--project', project.path]);
    expect(
      File(p.join(project.path, '.codeality-dart-baseline.json')).existsSync(),
      isFalse,
    );
  });

  test(
    'baseline create records debt, then check passes and a new finding fails',
    () async {
      final (created, _, _) = await runCliCapture([
        'baseline',
        'create',
        '--project',
        project.path,
      ]);
      expect(created, 0);
      var (code, out, _) = await runCliCapture([
        'baseline',
        'check',
        '--project',
        project.path,
      ]);
      expect(code, 0);
      expect(out, contains('0 new, 1 known, 0 resolved'));
      write('lib/c.dart', 'class C {}\nclass D {}\n');
      (code, out, _) = await runCliCapture([
        'baseline',
        'check',
        '--project',
        project.path,
      ]);
      expect(code, 1);
      expect(out, contains('1 new, 1 known, 0 resolved'));
    },
  );

  test('baseline create refuses to overwrite; update does', () async {
    await runCliCapture(['baseline', 'create', '--project', project.path]);
    final (again, _, err) = await runCliCapture([
      'baseline',
      'create',
      '--project',
      project.path,
    ]);
    expect(again, 2);
    expect(err, contains('baseline update'));
    final (updated, _, _) = await runCliCapture([
      'baseline',
      'update',
      '--project',
      project.path,
    ]);
    expect(updated, 0);
  });

  test('a configuration error exits 2', () async {
    write('codeality-dart.yaml', 'nonsense: 1\n');
    final (code, _, err) = await runCliCapture([
      'check',
      '--project',
      project.path,
    ]);
    expect(code, 2);
    expect(err, contains('nonsense'));
  });

  test('paths restrict the report to those files or directories', () async {
    write('lib/sub/x.dart', 'class X {}\nclass Y {}\n');
    final (code, out, _) = await runCliCapture([
      'check',
      '--project',
      project.path,
      'lib/sub',
    ]);
    expect(code, 1);
    expect(out, contains('lib/sub/x.dart'));
    expect(out, isNot(contains('lib/a.dart')));
  });

  test('--fail-fast stops after the first file with findings', () async {
    write('lib/z.dart', 'class Z {}\nclass W {}\n');
    final (_, out, _) = await runCliCapture([
      'check',
      '--project',
      project.path,
      '--fail-fast',
    ]);
    expect(out, contains('lib/a.dart'));
    expect(out, isNot(contains('lib/z.dart')));
  });
}
