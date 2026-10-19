import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:codeality_dart/src/cli/run_cli.dart';

/// Run the CLI in-process and return exit code, stdout and stderr.
Future<(int, String, String)> runCliCapture(List<String> args) async {
  final out = StreamController<List<int>>();
  final err = StreamController<List<int>>();
  final outText = utf8.decodeStream(out.stream);
  final errText = utf8.decodeStream(err.stream);
  final outSink = IOSink(out.sink);
  final errSink = IOSink(err.sink);
  final code = await runCli(args, out: outSink, err: errSink);
  await outSink.close();
  await errSink.close();
  return (code, await outText, await errText);
}
