import 'dart:convert';

import '../gate/gate_result.dart';
import '../version.dart';
import 'stage_document.dart';

const int _schemaVersion = 1;

/// The versioned machine-readable gate document.
String renderGateJson(GateResult result) =>
    const JsonEncoder.withIndent('  ').convert({
      'schema_version': _schemaVersion,
      'tool': {'name': 'codeality-dart', 'version': packageVersion},
      'exit_code': result.exitCode,
      'stages': result.stages.map(stageDocument).toList(),
    });
