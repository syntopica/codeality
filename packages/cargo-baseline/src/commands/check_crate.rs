use std::path::Path;

use crate::config::BaselineConfig;
use crate::engine::collect_rust_files::collect_rust_files;
use crate::engine::crate_info::CrateInfo;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::rule::Rule;
use crate::engine::severity::Severity;
use crate::rules::barrel_only_mod::BarrelOnlyMod;
use crate::rules::file_matches_item::FileMatchesItem;
use crate::rules::max_file_lines::MaxFileLines;
use crate::rules::max_trait_methods::MaxTraitMethods;
use crate::rules::no_inline_sql::NoInlineSql;
use crate::rules::one_primary_unit::OnePrimaryUnit;
use crate::rules::tauri_command_placement::TauriCommandPlacement;
use crate::tips::anyhow_in_lib_tip::anyhow_in_lib_tip;
use crate::tips::oversized_crate_tip::oversized_crate_tip;
use crate::tips::rusqlite_tip::rusqlite_tip;
use crate::tips::unwrap_density_tip::unwrap_density_tip;

/// Parses every `.rs` file under `root/src`, runs the rule set and the tip
/// set over them, and returns every diagnostic produced for this one crate.
pub fn check_crate(root: &Path, cfg: &BaselineConfig) -> Vec<Diagnostic> {
    let mut diagnostics = Vec::new();
    let files = parse_source_files(root, &mut diagnostics);

    run_rules(&files, cfg, &mut diagnostics);

    if let Ok(info) = CrateInfo::load(root) {
        run_tips(&info, &files, cfg, &mut diagnostics);
    }

    diagnostics
}

fn parse_source_files(root: &Path, diagnostics: &mut Vec<Diagnostic>) -> Vec<FileContext> {
    let mut files = Vec::new();
    for path in collect_rust_files(&root.join("src")) {
        let parsed = std::fs::read_to_string(&path)
            .map_err(anyhow::Error::from)
            .and_then(|source| FileContext::parse(&path, source));
        match parsed {
            Ok(ctx) => files.push(ctx),
            Err(err) => diagnostics.push(Diagnostic {
                path,
                line: 1,
                rule: "parse-error",
                severity: Severity::Error,
                message: err.to_string(),
            }),
        }
    }
    files
}

fn run_rules(files: &[FileContext], cfg: &BaselineConfig, diagnostics: &mut Vec<Diagnostic>) {
    let rules: Vec<Box<dyn Rule>> = vec![
        Box::new(MaxFileLines),
        Box::new(OnePrimaryUnit),
        Box::new(NoInlineSql),
        Box::new(MaxTraitMethods),
        Box::new(BarrelOnlyMod),
        Box::new(TauriCommandPlacement),
        Box::new(FileMatchesItem),
    ];

    for rule in &rules {
        if cfg.disabled_rules.iter().any(|name| name == rule.name()) {
            continue;
        }
        for ctx in files {
            diagnostics.extend(rule.check(ctx, cfg));
        }
    }
}

fn run_tips(
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
        unwrap_density_tip(info, files, cfg),
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

fn push_tip(
    name: &str,
    tip: Vec<Diagnostic>,
    cfg: &BaselineConfig,
    diagnostics: &mut Vec<Diagnostic>,
) {
    if cfg.disabled_tips.iter().any(|disabled| disabled == name) {
        return;
    }
    diagnostics.extend(tip);
}
