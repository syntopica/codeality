import 'package:analyzer/dart/ast/ast.dart';

import '../config/dart_config.dart';
import '../model/module_role.dart';
import 'configured_role.dart';
import 'has_generated_marker.dart';
import 'is_directive_only.dart';
import 'is_generated_path.dart';
import 'is_test_path.dart';

/// The one role of [path], in the spec's precedence: generated, test,
/// barrel, configured entrypoint or data, ordinary.
ModuleRole assignModuleRole(
  String path,
  CompilationUnit unit,
  String text,
  DartConfig config,
) {
  if (isGeneratedPath(path, config) || hasGeneratedMarker(text)) {
    return ModuleRole.generated;
  }
  if (isTestPath(path, config)) return ModuleRole.test;
  if (isDirectiveOnly(unit)) return ModuleRole.barrel;
  return configuredRole(path, config) ?? ModuleRole.ordinary;
}
