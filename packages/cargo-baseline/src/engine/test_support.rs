//! Test-only helpers shared by rule and tip tests. Not part of the public
//! engine API.

#[cfg(test)]
use std::path::{Path, PathBuf};

#[cfg(test)]
use crate::engine::crate_info::CrateInfo;
#[cfg(test)]
use crate::engine::file_context::FileContext;

/// Creates a fresh temp directory named `dir_name` holding a minimal
/// single-package `Cargo.toml`, and loads it as `CrateInfo`.
#[cfg(test)]
#[allow(clippy::unwrap_used)]
pub(crate) fn temp_crate_info(dir_name: &str) -> CrateInfo {
    let root = std::env::temp_dir().join(dir_name);
    std::fs::remove_dir_all(&root).ok();
    std::fs::create_dir_all(&root).unwrap();
    std::fs::write(
        root.join("Cargo.toml"),
        "[package]\nname=\"a\"\nversion=\"0.1.0\"\nedition=\"2024\"\n",
    )
    .unwrap();
    CrateInfo::load(&root).unwrap()
}

/// Parses `src` into a `FileContext` at `path`.
#[cfg(test)]
#[allow(clippy::unwrap_used)]
pub(crate) fn parse_file_ctx(path: &str, src: &str) -> FileContext {
    FileContext::parse(Path::new(path), src.into()).unwrap()
}

/// Parses `src` into a `FileContext` at a fixed dummy path (`src/x.rs`), for
/// rule tests that don't care about the file's location.
#[cfg(test)]
#[allow(clippy::unwrap_used)]
pub(crate) fn parse_dummy_file(src: &str) -> FileContext {
    FileContext::parse(Path::new("src/x.rs"), src.into()).unwrap()
}

/// Creates a temp workspace root named `dir_name` plus a member crate at
/// `crates/a` (with its own `src/`). Callers write both Cargo.toml manifests.
#[cfg(test)]
#[allow(clippy::unwrap_used)]
pub(crate) fn temp_workspace_and_member(dir_name: &str) -> (PathBuf, PathBuf) {
    let root = std::env::temp_dir().join(dir_name);
    std::fs::remove_dir_all(&root).ok();
    let member = root.join("crates/a");
    std::fs::create_dir_all(member.join("src")).unwrap();
    (root, member)
}
