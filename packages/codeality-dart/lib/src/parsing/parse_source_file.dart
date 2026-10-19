import 'dart:io';

import 'package:analyzer/dart/analysis/utilities.dart';
import 'package:path/path.dart' as p;

import '../config/dart_config.dart';
import '../roles/assign_module_role.dart';
import 'source_file.dart';

/// Parse [path] syntactically. Nothing is resolved: the rules never need
/// types, and the consumer's packages are not available to a global tool.
SourceFile parseSourceFile(String projectRoot, String path, DartConfig config) {
  var text = File(p.join(projectRoot, path)).readAsStringSync();
  if (text.startsWith('﻿')) text = text.substring(1);
  final result = parseString(content: text, throwIfDiagnostics: false);
  return SourceFile(
    path: path,
    text: text,
    unit: result.unit,
    lineInfo: result.lineInfo,
    role: assignModuleRole(path, result.unit, text, config),
    parseErrors: result.errors,
  );
}
