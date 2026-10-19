/// What the analyzer skips: build output, generated code and, in Flutter
/// projects, the platform runners.
List<String> defaultAnalyzerExcludes({required bool flutter}) => [
  'build/**',
  '**/*.g.dart',
  '**/*.freezed.dart',
  if (flutter) ...[
    'android/**',
    'ios/**',
    'linux/**',
    'macos/**',
    'web/**',
    'windows/**',
  ],
];
