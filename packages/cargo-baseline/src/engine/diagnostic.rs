use std::fmt;
use std::path::PathBuf;

use crate::engine::severity::Severity;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Diagnostic {
    pub path: PathBuf,
    pub line: usize,
    pub rule: &'static str,
    pub severity: Severity,
    pub message: String,
}

impl fmt::Display for Diagnostic {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let kind = match self.severity {
            Severity::Error => "error",
            Severity::Tip => "tip",
        };
        write!(
            f,
            "{}:{}: {kind}[{}]: {}",
            self.path.display(),
            self.line,
            self.rule,
            self.message
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::severity::Severity;

    #[test]
    fn renders_eslint_style_line() {
        let d = Diagnostic {
            path: "src/store.rs".into(),
            line: 42,
            rule: "max-file-lines",
            severity: Severity::Error,
            message: "file has 300 lines (max 150)".into(),
        };
        assert_eq!(
            d.to_string(),
            "src/store.rs:42: error[max-file-lines]: file has 300 lines (max 150)"
        );
    }
}
