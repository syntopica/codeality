/// The one role a source file plays, deciding which rules apply.
public enum ModuleRole: String, Sendable {
    case excluded
    case generated
    case test
    case extensionOnly = "extension-only"
    case entrypoint
    case ordinary
}
