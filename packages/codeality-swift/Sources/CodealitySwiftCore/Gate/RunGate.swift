import Foundation

/// Run [stages] in order, timing each. Every stage runs unless [failFast],
/// which stops at the first stage that did not pass.
public func runGate(_ stages: [GateStage], failFast: Bool) async -> GateResult {
  var results: [StageResult] = []
  for stage in stages {
    let started = Date()
    var result = await stage()
    result.seconds = Date().timeIntervalSince(started)
    results.append(result)
    if failFast && (result.status == .findings || result.status == .failedToRun) { break }
  }
  return GateResult(stages: results)
}
