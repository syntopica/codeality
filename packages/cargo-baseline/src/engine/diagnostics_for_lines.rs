use std::path::Path;

use crate::engine::diagnostic::Diagnostic;
use crate::engine::severity::Severity;

/// Builds one `Diagnostic` per `(line, message)` entry, all sharing the same
/// path/rule/severity. Shared by rules whose violations reduce to "this line
/// has this message" (e.g. `no-inline-sql`, `one-primary-unit`).
pub fn diagnostics_for_lines(
    path: &Path,
    rule: &'static str,
    severity: Severity,
    entries: impl IntoIterator<Item = (usize, String)>,
) -> Vec<Diagnostic> {
    entries
        .into_iter()
        .map(|(line, message)| Diagnostic {
            path: path.to_path_buf(),
            line,
            rule,
            severity,
            message,
        })
        .collect()
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    #[test]
    fn builds_one_diagnostic_per_entry() {
        let diags = diagnostics_for_lines(
            std::path::Path::new("src/x.rs"),
            "some-rule",
            Severity::Error,
            vec![(1, "first".to_string()), (2, "second".to_string())],
        );
        assert_eq!(diags.len(), 2);
        assert_eq!(diags[0].line, 1);
        assert_eq!(diags[0].message, "first");
        assert_eq!(diags[1].line, 2);
        assert_eq!(diags[1].message, "second");
    }

    #[test]
    fn empty_entries_yield_no_diagnostics() {
        let diags = diagnostics_for_lines(
            std::path::Path::new("src/x.rs"),
            "some-rule",
            Severity::Error,
            Vec::new(),
        );
        assert!(diags.is_empty());
    }
}
