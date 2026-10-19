/// [workflow] without job [jobId]'s lines: its key line under `jobs:` and
/// every following line indented deeper, or blank.
func removeJob(_ workflow: String, _ jobId: String) -> String {
  var lines = workflow.split(separator: "\n", omittingEmptySubsequences: false)
  let key = lines.firstIndex {
    $0.trimmingCharacters(in: .whitespaces) == "\(jobId):" && $0.first == " "
  }
  guard let start = key else { return workflow }
  let indent = lines[start].prefix { $0 == " " }.count
  var end = start + 1
  while end < lines.count,
    lines[end].allSatisfy(\.isWhitespace) || lines[end].prefix(while: { $0 == " " }).count > indent
  {
    end += 1
  }
  lines.removeSubrange(start..<end)
  return lines.joined(separator: "\n")
}
