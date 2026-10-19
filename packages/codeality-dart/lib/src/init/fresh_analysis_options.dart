import 'default_analyzer_excludes.dart';
import 'lints_include.dart';

/// A new `analysis_options.yaml`.
String freshAnalysisOptions({required bool flutter}) => [
  'include: ${lintsInclude(flutter: flutter)}',
  '',
  'analyzer:',
  '  exclude:',
  for (final glob in defaultAnalyzerExcludes(flutter: flutter)) "    - '$glob'",
  '',
].join('\n');
