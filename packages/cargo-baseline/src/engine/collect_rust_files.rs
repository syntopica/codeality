use std::path::{Path, PathBuf};

use walkdir::WalkDir;

/// Every `.rs` file under `dir`, sorted, skipping build output and any nested
/// crate.
///
/// A directory with its own `Cargo.toml` belongs to a different crate and is
/// not this one's source: `<crate>/tests` is walked as a root, and this
/// crate's own deliberately-broken fixtures live at
/// `tests/fixtures/<crate>/src`, where every rule they exist to trigger would
/// otherwise be reported against the crate under test.
pub fn collect_rust_files(dir: &Path) -> Vec<PathBuf> {
    let mut files: Vec<PathBuf> = WalkDir::new(dir)
        .into_iter()
        .filter_entry(|e| {
            e.file_name() != "target" && (e.depth() == 0 || !e.path().join("Cargo.toml").is_file())
        })
        .filter_map(Result::ok)
        .filter(|e| e.path().extension().is_some_and(|x| x == "rs"))
        .map(|e| e.into_path())
        .collect();
    files.sort();
    files
}
