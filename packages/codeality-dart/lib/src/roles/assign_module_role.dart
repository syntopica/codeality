import 'package:analyzer/dart/ast/ast.dart';

import '../config/dart_config.dart';
import '../model/module_role.dart';
import 'configured_role.dart';
import 'default_generated_globs.dart';
import 'has_generated_marker.dart';
import 'is_directive_only.dart';
import 'is_test_path.dart';
import 'matches_any_glob.dart';

/// The one role of [path], in the spec's precedence: generated, test,
/// barrel, configured entrypoint or data, ordinary.
ModuleRole assignModuleRole(
  String path,
  CompilationUnit unit,
  String text,
  DartConfig config,
) {
  if (matchesAnyGlob(path, [
        ...defaultGeneratedGlobs,
        ...?config.roles['generated'],
      ]) ||
      hasGeneratedMarker(text)) {
    return ModuleRole.generated;
  }
  if (isTestPath(path, config)) return ModuleRole.test;
  if (isDirectiveOnly(unit)) return ModuleRole.barrel;
  return configuredRole(path, config) ?? ModuleRole.ordinary;
}
