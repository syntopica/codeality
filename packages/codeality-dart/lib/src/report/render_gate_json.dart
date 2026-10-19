import 'dart:convert';

import '../gate/gate_result.dart';
import '../package_version.dart';
import 'report_schema_version.dart';
import 'stage_document.dart';

/// The versioned machine-readable gate document.
String renderGateJson(GateResult result) =>
    const JsonEncoder.withIndent('  ').convert({
      'schema_version': reportSchemaVersion,
      'tool': {'name': 'codeality-dart', 'version': packageVersion},
      'exit_code': result.exitCode,
      'stages': result.stages.map(stageDocument).toList(),
    });
