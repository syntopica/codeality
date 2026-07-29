#[cfg(test)]
use std::path::Path;

#[cfg(test)]
use crate::engine::file_context::FileContext;

/// Parses `src` into a `FileContext` at `path`.
#[cfg(test)]
#[allow(clippy::unwrap_used)]
pub(crate) fn parse_file_ctx(path: &str, src: &str) -> FileContext {
    FileContext::parse(Path::new(path), src.into()).unwrap()
}
