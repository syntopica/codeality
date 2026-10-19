/// A new `codeality-dart.yaml`. The `app` profile treats `lib/main*.dart`
/// as entrypoints (Flutter flavors), `package` treats `bin/*.dart`.
String freshDartConfig(String profile) => [
  '# codeality-dart configuration - https://github.com/syntopica/codeality',
  'schema-version: 1',
  'roles:',
  '  entrypoint:',
  if (profile == 'app') ...[
    '    - lib/main.dart',
    "    - 'lib/main_*.dart'",
  ] else
    "    - 'bin/*.dart'",
  '',
].join('\n');
