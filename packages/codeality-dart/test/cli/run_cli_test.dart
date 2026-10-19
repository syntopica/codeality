import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:codeality_dart/src/cli/run_cli.dart';
import 'package:test/test.dart';

Future<(int, String, String)> _run(List<String> args) async {
  final out = _Capture();
  final err = _Capture();
  final code = await runCli(args, out: out.sink, err: err.sink);
  return (code, await out.text(), await err.text());
}

final class _Capture {
  final StreamController<List<int>> _controller = StreamController();
  late final IOSink sink = IOSink(_controller.sink);
  late final Future<String> _text = utf8.decodeStream(_controller.stream);

  Future<String> text() async {
    final text = _text;
    await sink.close();
    return text;
  }
}

void main() {
  test('--version prints the tool name and version', () async {
    final (code, out, _) = await _run(['--version']);
    expect(code, 0);
    expect(out.trim(), 'codeality-dart 0.1.0');
  });

  test('an unknown command exits 2 with usage on stderr', () async {
    final (code, _, err) = await _run(['nonsense']);
    expect(code, 2);
    expect(err, contains('Usage'));
  });

  test('help lists the four commands', () async {
    final (_, out, _) = await _run(['--help']);
    for (final command in ['check', 'baseline', 'gate', 'init']) {
      expect(out, contains(command));
    }
  });
}
