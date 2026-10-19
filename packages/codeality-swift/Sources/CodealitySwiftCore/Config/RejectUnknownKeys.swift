/// Throw on a key the schema does not know, so a typo fails loudly instead
/// of silently keeping a default.
func rejectUnknownKeys(_ document: [String: Any], prefix: String = "") throws {
    for (key, value) in document {
        let path = prefix + key
        guard configSchema.contains(path) else {
            throw ConfigError("unknown key \"\(path)\" in codeality-swift.yaml")
        }
        if let nested = value as? [String: Any] {
            try rejectUnknownKeys(nested, prefix: path + ".")
        }
    }
}
