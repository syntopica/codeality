import 'package:test/test.dart';

import '../support/repo_fixture.dart';
import '../support/run_cli_capture.dart';

void main() {
  late RepoFixture repo;
  late String app;
  setUp(() {
    repo = RepoFixture();
    app = repo.flutterApp('app');
  });
  tearDown(() => repo.dispose());

  test('plan mode writes nothing', () async {
    final (code, out, _) = await runCliCapture(['init', '--project', app]);
    expect(code, 0);
    expect(out, contains('create'));
    expect(repo.exists('app/analysis_options.yaml'), isFalse);
    expect(repo.read('app/pubspec.yaml'), contains('flutter_lints'));
  });

  test('--apply writes creates and merges', () async {
    final (code, _, _) = await runCliCapture([
      'init',
      '--project',
      app,
      '--apply',
    ]);
    expect(code, 0);
    expect(repo.read('app/analysis_options.yaml'), contains('codeality_lints'));
    expect(repo.read('app/pubspec.yaml'), contains('codeality_lints'));
    expect(repo.exists('app/codeality-dart.yaml'), isTrue);
  });

  test('--check exits 2 on a conflict; --force replaces it', () async {
    repo.write(
      'app/analysis_options.yaml',
      'include:\n  - package:lints/core.yaml\n',
    );
    final (code, _, _) = await runCliCapture([
      'init',
      '--project',
      app,
      '--check',
    ]);
    expect(code, 2);
    await runCliCapture(['init', '--project', app, '--force']);
    expect(repo.read('app/analysis_options.yaml'), contains('codeality_lints'));
  });

  test('an existing codeality-dart.yaml is never overwritten', () async {
    repo.write(
      'app/codeality-dart.yaml',
      'schema-version: 1\ncoverage-threshold: 42\n',
    );
    await runCliCapture(['init', '--project', app, '--force']);
    expect(repo.read('app/codeality-dart.yaml'), contains('42'));
  });
}
