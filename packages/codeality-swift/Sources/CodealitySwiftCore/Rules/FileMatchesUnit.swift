/// BSW002: `Name.swift` for a file whose unit is `Name`, `Name+Topic.swift`
/// for an extension-only file of `Name`. A free function or variable may
/// also live in its UpperCamel file (`LoadConfig.swift` for `loadConfig`),
/// the Swift convention.
struct FileMatchesUnit: Rule {
    let code = RuleCode.bsw002

    func check(_ file: SourceFile, _ config: SwiftConfig) -> [Finding] {
        guard file.role == .ordinary || file.role == .extensionOnly,
            let expected = expectedFileStem(file)
        else { return [] }
        let stem = String(file.path.split(separator: "/").last ?? "").replacingOccurrences(
            of: ".swift", with: "")
        let matches =
            file.role == .extensionOnly
            ? stem.hasPrefix(expected) && stem.count > expected.count
            : stem == expected || stem == upperCamel(expected)
        guard !matches else { return [] }
        let wanted = file.role == .extensionOnly ? "\(expected)Topic.swift" : "\(expected).swift"
        return [
            Finding(
                code: code,
                message: "the file holds \(expected.trimmingCharacters(in: ["+"])); name it \(wanted)",
                location: Location(file.path, 1, 1), subject: expected)
        ]
    }
}
