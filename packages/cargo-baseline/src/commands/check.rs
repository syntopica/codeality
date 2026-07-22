use std::path::{Path, PathBuf};

use crate::commands::check_crate::check_crate;
use crate::config::BaselineConfig;
use crate::engine::crate_info::CrateInfo;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::severity::Severity;
use crate::rules::lints_inheritance::check_lints_inheritance;

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

fn partition_by_severity(mut diagnostics: Vec<Diagnostic>) -> (Vec<Diagnostic>, Vec<Diagnostic>) {
    diagnostics.sort_by(|a, b| (&a.path, a.line).cmp(&(&b.path, b.line)));
    diagnostics
        .into_iter()
        .partition(|d| d.severity == Severity::Error)
}

fn print_diagnostics(errors: &[Diagnostic], tips: &[Diagnostic]) {
    for d in errors {
        println!("{d}");
    }
    println!();
    for d in tips {
        println!("{d}");
    }
    println!("baseline: {} errors, {} tips", errors.len(), tips.len());
}
