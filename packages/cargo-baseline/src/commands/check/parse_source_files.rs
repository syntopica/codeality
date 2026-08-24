use std::path::Path;

use crate::engine::collect_rust_files::collect_rust_files;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::severity::Severity;

pub(super) fn parse_source_files(
    root: &Path,
    diagnostics: &mut Vec<Diagnostic>,
) -> Vec<FileContext> {
    let mut files = Vec::new();
    for path in collect_rust_files(&root.join("src")) {
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
