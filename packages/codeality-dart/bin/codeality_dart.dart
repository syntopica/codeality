import 'dart:io';

import 'package:codeality_dart/src/cli/run_cli.dart';

Future<void> main(List<String> args) async {
  exitCode = await runCli(args, out: stdout, err: stderr);
}
