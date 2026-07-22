use std::path::{Path, PathBuf};

use super::check_crate::check_crate;
use super::partition_by_severity::partition_by_severity;
use super::print_diagnostics::print_diagnostics;
use crate::config::BaselineConfig;
use crate::engine::crate_info::CrateInfo;
use crate::engine::diagnostic::Diagnostic;
use crate::rules::check_lints_inheritance::check_lints_inheritance;

pub fn run(path: &Path) -> anyhow::Result<()> {
    let info = CrateInfo::load(path)?;
    let cfg = BaselineConfig::load(path)?;

    let roots: Vec<PathBuf> = if info.is_workspace_root && !info.member_roots.is_empty() {
        info.member_roots.clone()
    } else {
        vec![path.to_path_buf()]
    };

    let mut diagnostics: Vec<Diagnostic> = roots
        .iter()
        .flat_map(|root| check_crate(root, &cfg))
        .collect();
    diagnostics.extend(check_lints_inheritance(&info));

    let (errors, tips) = partition_by_severity(diagnostics);
    print_diagnostics(&errors, &tips);

    if !errors.is_empty() {
        std::process::exit(1);
    }
    Ok(())
}
