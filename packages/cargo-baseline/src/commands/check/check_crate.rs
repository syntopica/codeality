use std::path::Path;

use super::parse_source_files::parse_source_files;
use super::run_rules::run_rules;
use super::run_tips::run_tips;
use crate::config::BaselineConfig;
use crate::engine::crate_info::CrateInfo;
use crate::engine::diagnostic::Diagnostic;

/// Parses every `.rs` file under `root/src`, runs the rule set and the tip
/// set over them, and returns every diagnostic produced for this one crate.
pub(super) fn check_crate(root: &Path, cfg: &BaselineConfig) -> Vec<Diagnostic> {
    let mut diagnostics = Vec::new();
    let files = parse_source_files(root, &mut diagnostics);

    run_rules(&files, cfg, &mut diagnostics);

    if let Ok(info) = CrateInfo::load(root) {
        run_tips(&info, &files, cfg, &mut diagnostics);
    }

    diagnostics
}
