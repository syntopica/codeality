import 'dart:io';

import 'package:args/command_runner.dart';

import 'baseline_check_command.dart';
import 'baseline_write_command.dart';

/// `codeality-dart baseline create|update|check`.
final class BaselineCommand extends Command<int> {
  BaselineCommand(IOSink out) {
    addSubcommand(BaselineWriteCommand(out, overwrite: false));
    addSubcommand(BaselineWriteCommand(out, overwrite: true));
    addSubcommand(BaselineCheckCommand(out));
  }

  @override
  String get name => 'baseline';

  @override
  String get description => 'Create, update or check the recorded debt.';
}
