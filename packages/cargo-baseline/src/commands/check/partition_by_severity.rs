use crate::engine::diagnostic::Diagnostic;
use crate::engine::severity::Severity;

pub(super) fn partition_by_severity(
    mut diagnostics: Vec<Diagnostic>,
) -> (Vec<Diagnostic>, Vec<Diagnostic>) {
    diagnostics.sort_by(|a, b| (&a.path, a.line).cmp(&(&b.path, b.line)));
    diagnostics
        .into_iter()
        .partition(|d| d.severity == Severity::Error)
}
