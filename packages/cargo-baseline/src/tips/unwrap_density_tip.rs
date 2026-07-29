use crate::config::BaselineConfig;
use crate::engine::crate_info::CrateInfo;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::severity::Severity;

pub fn unwrap_density_tip(
    info: &CrateInfo,
    files: &[FileContext],
    cfg: &BaselineConfig,
) -> Vec<Diagnostic> {
    let total: usize = files
        .iter()
        .map(|ctx| ctx.source.matches(".unwrap()").count() + ctx.source.matches(".expect(").count())
        .sum();

    if total <= cfg.unwrap_density {
        return Vec::new();
    }

    let path = files
        .first()
        .map_or_else(|| info.root.join("Cargo.toml"), |ctx| ctx.path.clone());

    vec![Diagnostic {
        path,
        line: 1,
        rule: "unwrap-density",
        severity: Severity::Tip,
        message: format!("{total} unwrap()/expect() calls - consolidate errors with thiserror"),
    }]
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::engine::test_support::{parse_file_ctx, temp_crate_info};

    #[test]
    fn flags_when_over_threshold() {
        let info = temp_crate_info("bl-unwrap-density-tip-over-threshold");
        let cfg = BaselineConfig {
            unwrap_density: 2,
            ..BaselineConfig::default()
        };
        let files = vec![parse_file_ctx(
            "src/a.rs",
            "fn a() { x.unwrap(); y.unwrap(); z.expect(\"z\"); }",
        )];
        let d = unwrap_density_tip(&info, &files, &cfg);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].rule, "unwrap-density");
        assert_eq!(d[0].path, std::path::PathBuf::from("src/a.rs"));
        assert!(d[0].message.contains("3 unwrap()/expect() calls"));
    }

    #[test]
    fn no_tip_under_threshold() {
        let info = temp_crate_info("bl-unwrap-density-tip-under-threshold");
        let cfg = BaselineConfig::default();
        let files = vec![parse_file_ctx("src/a.rs", "fn a() { x.unwrap(); }")];
        assert!(unwrap_density_tip(&info, &files, &cfg).is_empty());
    }

    #[test]
    fn no_tip_when_no_files() {
        let info = temp_crate_info("bl-unwrap-density-tip-no-files");
        let cfg = BaselineConfig::default();
        assert!(unwrap_density_tip(&info, &[], &cfg).is_empty());
    }
}
