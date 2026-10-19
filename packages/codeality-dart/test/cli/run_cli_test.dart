import 'package:test/test.dart';

import '../support/run_cli_capture.dart';

void main() {
  test('--version prints the tool name and version', () async {
    final (code, out, _) = await runCliCapture(['--version']);
    expect(code, 0);
    expect(out.trim(), 'codeality-dart 0.1.0');
  });

  test('an unknown command exits 2 with usage on stderr', () async {
    final (code, _, err) = await runCliCapture(['nonsense']);
    expect(code, 2);
    expect(err, contains('Usage'));
  });

  test('help lists the four commands', () async {
    final (_, out, _) = await runCliCapture(['--help']);
    for (final command in ['check', 'baseline', 'gate', 'init']) {
      expect(out, contains(command));
    }
  });
}
