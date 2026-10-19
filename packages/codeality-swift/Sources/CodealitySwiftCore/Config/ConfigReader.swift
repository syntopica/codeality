/// Typed reads of dotted keys, each failing with a ConfigError naming the
/// key when the value has the wrong shape.
struct ConfigReader {
    let document: [String: Any]

    func value(_ key: String) -> Any? {
        var current: Any? = document
        for part in key.split(separator: ".") {
            current = (current as? [String: Any])?[String(part)]
        }
        return current
    }

    func integer(_ key: String, _ fallback: Int) throws -> Int {
        guard let raw = value(key) else { return fallback }
        guard let number = raw as? Int else { throw ConfigError("\(key) must be an integer") }
        return number
    }

    func optionalInteger(_ key: String) throws -> Int? {
        guard value(key) != nil else { return nil }
        return try integer(key, 0)
    }

    func optionalNumber(_ key: String) throws -> Double? {
        guard let raw = value(key) else { return nil }
        if let number = raw as? Double { return number }
        if let number = raw as? Int { return Double(number) }
        throw ConfigError("\(key) must be a number")
    }

    func strings(_ key: String, _ fallback: [String]) throws -> [String] {
        guard let raw = value(key) else { return fallback }
        guard let list = raw as? [Any], let strings = list as? [String] else {
            throw ConfigError("\(key) must be a list of strings")
        }
        return strings
    }
}
