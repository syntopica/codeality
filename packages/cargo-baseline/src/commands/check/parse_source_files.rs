use std::path::Path;

use crate::engine::collect_rust_files::collect_rust_files;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::severity::Severity;

/// Parses every `.rs` file under the crate's `src` and `tests` directories.
///
/// `tests` is walked because cargo integration tests are code the crate ships
/// and maintains, and leaving them unread put them outside every rule rather
/// than deliberately exempting them. Which rules actually speak there is
/// decided per rule, by `Rule::applies_to_test_scope`.
pub(super) fn parse_source_files(
    root: &Path,
    diagnostics: &mut Vec<Diagnostic>,
) -> Vec<FileContext> {
    let mut files = Vec::new();
    let roots = [root.join("src"), root.join("tests")];
    for path in roots.iter().flat_map(|dir| collect_rust_files(dir)) {
        let parsed = std::fs::read_to_string(&path)
            .map_err(anyhow::Error::from)
            .and_then(|source| FileContext::parse(&path, source));
        match parsed {
            Ok(ctx) => files.push(ctx),
            Err(err) => diagnostics.push(Diagnostic {
                path,
                line: 1,
                rule: "parse-error",
                severity: Severity::Error,
                message: err.to_string(),
            }),
        }
    }
    files
}
