import 'package:path/path.dart' as p;

import '../model/gate_finding.dart';
import '../model/location.dart';
import 'machine_severities.dart';
import 'split_machine_record.dart';

/// Diagnostics from `dart analyze --format=machine`:
/// `severity|type|code|absolute path|line|column|length|message`.
List<GateFinding> parseMachineOutput(String output, String projectRoot) => [
  for (final line in output.split('\n'))
    if (splitMachineRecord(line)
        case [
          final severity,
          _,
          final code,
          final path,
          final row,
          final column,
          _,
          final message,
        ]
        when machineSeverities.contains(severity))
      GateFinding(
        code: code.toLowerCase(),
        message: '${severity.toLowerCase()}: $message',
        location: Location(
          p.posix.joinAll(p.split(p.relative(path, from: projectRoot))),
          int.tryParse(row) ?? 1,
          int.tryParse(column) ?? 1,
        ),
      ),
];
