/// Directory names skipped only directly under the project root: build
/// output and the native platform folders of a Flutter project. Deeper
/// down the same names are ordinary source folders (`lib/src/web/` for a
/// conditional import).
const Set<String> projectRootExcludes = {
  'build',
  'ios',
  'android',
  'macos',
  'windows',
  'linux',
  'web',
};
