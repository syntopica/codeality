import Foundation

/// A caller for `codeality.yml` when the repository has no CI; otherwise a
/// note on how to call it, or nothing when something already does.
func planCallerWorkflow(repoRoot: String) -> PlannedFile? {
  let directory = URL(fileURLWithPath: repoRoot).appendingPathComponent(".github/workflows")
  let others = ((try? FileManager.default.contentsOfDirectory(atPath: directory.path)) ?? [])
    .filter { ($0.hasSuffix(".yml") || $0.hasSuffix(".yaml")) && $0 != "codeality.yml" }
  if others.isEmpty {
    return PlannedFile(
      path: directory.appendingPathComponent("quality.yml").path, disposition: .create,
      detail: "no CI workflow; calls codeality.yml on push and pull_request",
      content: minimalCallerWorkflow)
  }
  let calls = others.contains { name in
    ((try? String(contentsOf: directory.appendingPathComponent(name), encoding: .utf8)) ?? "")
      .contains("codeality.yml")
  }
  return calls
    ? nil
    : PlannedFile(
      path: directory.path, disposition: .unchanged,
      detail:
        "nothing calls codeality.yml yet; add a job to your CI with `uses: ./.github/workflows/codeality.yml`"
    )
}
