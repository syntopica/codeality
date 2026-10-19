/// The one role of [path], in the spec's precedence: excluded, generated,
/// test, extension-only, configured entrypoint, ordinary.
public func assignModuleRole(path: String, text: String, extensionOnly: Bool, config: SwiftConfig)
  throws -> ModuleRole
{
  if config.exclude.contains(where: { matchesGlob(path, $0) }) { return .excluded }
  if config.generated.contains(where: { matchesGlob(path, $0) }) || hasGeneratedMarker(text) {
    return .generated
  }
  if isTestPath(path, config) { return .test }
  if extensionOnly { return .extensionOnly }
  if config.entrypoint.contains(where: { matchesGlob(path, $0) }) { return .entrypoint }
  return .ordinary
}
