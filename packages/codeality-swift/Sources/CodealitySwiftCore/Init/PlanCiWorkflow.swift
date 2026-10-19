import Foundation

/// Merge the swift job into the repository's root `codeality.yml`, leaving
/// every other job byte-identical.
func planCiWorkflow(repoRoot: String, jobText: String) -> PlannedFile {
  let path = URL(fileURLWithPath: repoRoot).appendingPathComponent(
    ".github/workflows/codeality.yml"
  ).path
  guard let text = try? String(contentsOfFile: path, encoding: .utf8) else {
    return PlannedFile(
      path: path, disposition: .create, detail: "not present",
      content: codealityWorkflowHeader + jobText)
  }
  let expected = workflowJob("jobs:\n" + jobText, swiftJobId)
  guard let existing = workflowJob(text, swiftJobId) else {
    return PlannedFile(
      path: path, disposition: .merge, detail: "add job \(swiftJobId)",
      content: insertJob(text, jobText))
  }
  if existing == expected {
    return PlannedFile(path: path, disposition: .unchanged, detail: "job \(swiftJobId) current")
  }
  return PlannedFile(
    path: path, disposition: .conflict,
    detail: "job \(swiftJobId) was edited; use --force to replace it",
    content: insertJob(removeJob(text, swiftJobId), jobText))
}
