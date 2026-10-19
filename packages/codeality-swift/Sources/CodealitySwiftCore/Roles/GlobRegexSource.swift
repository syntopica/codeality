/// The anchored regular expression for a POSIX glob: `**/` any directories,
/// `**` anything, `*` within one segment, `?` one character.
func globRegexSource(_ glob: String) -> String {
    var source = "^"
    var characters = Array(glob)[...]
    while let character = characters.popFirst() {
        switch character {
        case "*" where characters.first == "*":
            characters.removeFirst()
            if characters.first == "/" {
                characters.removeFirst()
                source += "(?:.*/)?"
            } else {
                source += ".*"
            }
        case "*": source += "[^/]*"
        case "?": source += "[^/]"
        case _ where "\\^$.|+()[]{}".contains(character): source += "\\\(character)"
        default: source.append(character)
        }
    }
    return source + "$"
}
