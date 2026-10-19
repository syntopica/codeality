import 'package:yaml/yaml.dart';
import 'package:yaml_edit/yaml_edit.dart';

import 'default_analyzer_excludes.dart';
import 'lints_include.dart';

/// Set the include and add missing excludes in [text], keeping everything
/// else. Returns the edited text and what changed, or null when the include
/// is a list this cannot rewrite safely.
(String, List<String>)? mergeAnalysisOptions(
  String text, {
  required bool flutter,
}) {
  final editor = YamlEditor(text);
  final document = loadYaml(text);
  final map = document is YamlMap ? document : null;
  final changes = <String>[];
  final include = lintsInclude(flutter: flutter);
  final current = map?['include'];
  if (current is YamlList) {
    if (!current.contains(include)) return null;
  } else if (current != include) {
    editor.update(['include'], include);
    changes.add(
      current == null ? 'include $include' : 'include $current -> $include',
    );
  }
  final analyzer = map?['analyzer'];
  final existing = analyzer is YamlMap ? analyzer['exclude'] : null;
  final missing = [
    for (final glob in defaultAnalyzerExcludes(flutter: flutter))
      if (existing is! YamlList || !existing.contains(glob)) glob,
  ];
  if (missing.isNotEmpty) {
    if (analyzer is! YamlMap) {
      editor.update(['analyzer'], {'exclude': missing});
    } else if (existing is! YamlList) {
      editor.update(['analyzer', 'exclude'], missing);
    } else {
      for (final glob in missing) {
        editor.appendToList(['analyzer', 'exclude'], glob);
      }
    }
    changes.add('exclude ${missing.join(', ')}');
  }
  return (editor.toString(), changes);
}
