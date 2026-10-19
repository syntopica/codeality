/// Directory names never scanned: tool output and the native platform
/// folders of a Flutter project.
const Set<String> defaultExcludes = {
  '.dart_tool',
  '.git',
  'build',
  'ios',
  'android',
  'macos',
  'windows',
  'linux',
  'web',
};
