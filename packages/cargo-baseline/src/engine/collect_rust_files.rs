use std::path::{Path, PathBuf};

use walkdir::WalkDir;

#[allow(dead_code)]
pub fn collect_rust_files(src_dir: &Path) -> Vec<PathBuf> {
    let mut files: Vec<PathBuf> = WalkDir::new(src_dir)
        .into_iter()
        .filter_entry(|e| e.file_name() != "target")
        .filter_map(Result::ok)
        .filter(|e| e.path().extension().is_some_and(|x| x == "rs"))
        .map(|e| e.into_path())
        .collect();
    files.sort();
    files
}
