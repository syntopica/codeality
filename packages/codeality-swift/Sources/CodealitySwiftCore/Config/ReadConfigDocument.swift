import Foundation
import Yams

/// The parsed `codeality-swift.yaml` mapping. Unlike Dart, there is no
/// default config: `roots` cannot be guessed for an Xcode project.
func readConfigDocument(projectRoot: String) throws -> [String: Any] {
    let path = URL(fileURLWithPath: projectRoot).appendingPathComponent(configFileName).path
    guard let text = try? String(contentsOfFile: path, encoding: .utf8) else {
        throw ConfigError("\(configFileName) not found in \(projectRoot); run codeality-swift init")
    }
    let parsed: Any?
    do {
        parsed = try Yams.load(yaml: text)
    } catch {
        throw ConfigError("\(configFileName) is not valid YAML: \(error)")
    }
    if parsed == nil { return [:] }
    guard let document = parsed as? [String: Any] else {
        throw ConfigError("\(configFileName) must be a mapping")
    }
    return document
}
