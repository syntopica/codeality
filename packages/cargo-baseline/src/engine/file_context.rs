use std::path::{Path, PathBuf};

use anyhow::Context;

#[allow(dead_code)]
pub struct FileContext {
    pub path: PathBuf,
    pub source: String,
    pub ast: syn::File,
}

impl FileContext {
    #[allow(dead_code)]
    pub fn parse(path: &Path, source: String) -> anyhow::Result<Self> {
        let ast = syn::parse_file(&source)
            .with_context(|| format!("failed to parse {}", path.display()))?;
        Ok(Self { path: path.to_path_buf(), source, ast })
    }
}
