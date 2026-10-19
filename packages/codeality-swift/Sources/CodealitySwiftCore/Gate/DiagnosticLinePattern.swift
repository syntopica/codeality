/// A `path:line:column: error: message` diagnostic line.
var diagnosticLinePattern: Regex<(Substring, path: Substring, line: Substring, column: Substring, message: Substring)> {
    #/^(?<path>.+?):(?<line>\d+):(?<column>\d+): (?:error|warning): (?<message>.*)$/#
}
