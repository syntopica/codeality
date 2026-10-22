export function reportAuditOutcome(advisories, outcome, level) {
  for (const { advisory, entry } of outcome.waived) {
    console.log(
      `waived   ${advisory.severity.padEnd(8)} ${advisory.github_advisory_id} ` +
        `${advisory.module_name}  (expires ${entry.expires})\n         ${entry.reason}`,
    )
  }
  for (const { advisory, entry } of outcome.stale) {
    console.error(
      `EXPIRED  ${advisory.severity.padEnd(8)} ${advisory.github_advisory_id} ` +
        `${advisory.module_name}  (expired ${entry.expires})\n         ${entry.reason}\n` +
        '         Re-check it, then renew the entry or remove it.',
    )
  }
  for (const advisory of outcome.failures) {
    console.error(
      `FAIL     ${advisory.severity.padEnd(8)} ${advisory.github_advisory_id} ` +
        `${advisory.module_name} ${advisory.vulnerable_versions}\n` +
        `         patched in ${advisory.patched_versions} - ${advisory.url}\n` +
        `         via ${(advisory.findings?.[0]?.paths ?? []).slice(0, 2).join(', ')}`,
    )
  }
  console.log(
    `\nbaseline-audit: ${advisories.length} advisories, gate at ${level}: ` +
      `${outcome.failures.length} unwaived, ${outcome.stale.length} expired, ${outcome.waived.length} waived.`,
  )
  return outcome.failures.length + outcome.stale.length > 0 ? 1 : 0
}
