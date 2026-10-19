/// Whether the project-relative POSIX [path] matches [glob].
func matchesGlob(_ path: String, _ glob: String) -> Bool {
    guard let regex = try? Regex(globRegexSource(glob)) else { return false }
    return path.wholeMatch(of: regex) != nil
}
