use crate::config::BaselineConfig;
use crate::engine::crate_info::CrateInfo;
use crate::engine::diagnostic::Diagnostic;
use crate::engine::file_context::FileContext;
use crate::engine::severity::Severity;

pub fn oversized_crate_tip(
    info: &CrateInfo,
    files: &[FileContext],
    cfg: &BaselineConfig,
) -> Vec<Diagnostic> {
    let file_count = files.len();
    let line_count: usize = files.iter().map(|ctx| ctx.source.lines().count()).sum();

    if !(file_count > cfg.crate_max_files || line_count > cfg.crate_max_lines) {
        return Vec::new();
    }

    vec![Diagnostic {
        path: info.root.join("Cargo.toml"),
        line: 1,
        rule: "oversized-crate",
        severity: Severity::Tip,
        message: format!(
            "crate has {file_count} files / {line_count} lines - consider splitting into workspace crates (crates/ flat layout)"
        ),
    }]
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;
    use crate::engine::parse_file_ctx::parse_file_ctx;
    use crate::engine::temp_crate_info::temp_crate_info;

    #[test]
    fn flags_when_file_count_exceeds_max() {
        let info = temp_crate_info("bl-oversized-crate-tip-file-count-exceeds");
        let cfg = BaselineConfig {
            crate_max_files: 1,
            ..BaselineConfig::default()
        };
        let files = vec![
            parse_file_ctx("src/a.rs", "fn a() {}"),
            parse_file_ctx("src/b.rs", "fn b() {}"),
        ];
        let d = oversized_crate_tip(&info, &files, &cfg);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].rule, "oversized-crate");
        assert_eq!(d[0].path, info.root.join("Cargo.toml"));
    }

    #[test]
    fn flags_when_line_count_exceeds_max() {
        let info = temp_crate_info("bl-oversized-crate-tip-line-count-exceeds");
        let cfg = BaselineConfig {
            crate_max_lines: 1,
            ..BaselineConfig::default()
        };
        let files = vec![parse_file_ctx("src/a.rs", "fn a() {}\nfn b() {}\n")];
        let d = oversized_crate_tip(&info, &files, &cfg);
        assert_eq!(d.len(), 1);
    }

    #[test]
    fn no_tip_when_within_limits() {
        let info = temp_crate_info("bl-oversized-crate-tip-within-limits");
        let cfg = BaselineConfig::default();
        let files = vec![parse_file_ctx("src/a.rs", "fn a() {}\n")];
        assert!(oversized_crate_tip(&info, &files, &cfg).is_empty());
    }
}
