use super::push_tip::push_tip;
use crate::config::BaselineConfig;
use crate::engine::crate_info::CrateInfo;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::tips::anyhow_in_lib_tip::anyhow_in_lib_tip;
use crate::tips::oversized_crate_tip::oversized_crate_tip;
use crate::tips::rusqlite_tip::rusqlite_tip;
use crate::tips::unwrap_density_tip::unwrap_density_tip;

pub(super) fn run_tips(
    info: &CrateInfo,
    files: &[FileContext],
    cfg: &BaselineConfig,
    diagnostics: &mut Vec<Diagnostic>,
) {
    push_tip("rusqlite", rusqlite_tip(info, files, cfg), cfg, diagnostics);
    push_tip(
        "anyhow-in-lib",
        anyhow_in_lib_tip(info, files, cfg),
        cfg,
        diagnostics,
    );
    push_tip(
        "unwrap-density",
        unwrap_density_tip(files, cfg),
        cfg,
        diagnostics,
    );
    push_tip(
        "oversized-crate",
        oversized_crate_tip(info, files, cfg),
        cfg,
        diagnostics,
    );
}
