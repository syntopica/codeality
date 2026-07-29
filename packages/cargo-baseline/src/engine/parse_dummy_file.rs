#[cfg(test)]
use std::path::Path;

#[cfg(test)]
use crate::engine::file_context::FileContext;

/// Parses `src` into a `FileContext` at a fixed dummy path (`src/x.rs`), for
/// rule tests that don't care about the file's location.
#[cfg(test)]
#[allow(clippy::unwrap_used)]
pub(crate) fn parse_dummy_file(src: &str) -> FileContext {
    FileContext::parse(Path::new("src/x.rs"), src.into()).unwrap()
}
