use std::path::Path;

use anyhow::Context;
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct BaselineConfig {
    pub max_file_lines: usize,
    pub max_trait_methods: usize,
    pub crate_max_files: usize,
    pub crate_max_lines: usize,
    pub unwrap_density: usize,
    pub disabled_rules: Vec<String>,
    pub disabled_tips: Vec<String>,
}

impl Default for BaselineConfig {
    fn default() -> Self {
        Self {
            max_file_lines: 150,
            max_trait_methods: 12,
            crate_max_files: 75,
            crate_max_lines: 8000,
            unwrap_density: 10,
            disabled_rules: Vec::new(),
            disabled_tips: Vec::new(),
        }
    }
}

impl BaselineConfig {
    pub fn load(dir: &Path) -> anyhow::Result<Self> {
        let path = dir.join("baseline.toml");
        if !path.exists() {
            return Ok(Self::default());
        }
        let text = std::fs::read_to_string(&path)
            .with_context(|| format!("reading {}", path.display()))?;
        toml::from_str(&text).with_context(|| format!("parsing {}", path.display()))
    }
}

#[cfg(test)]
#[allow(clippy::unwrap_used)]
mod tests {
    use super::*;

    #[test]
    fn defaults_match_spec() {
        let c = BaselineConfig::default();
        assert_eq!(c.max_file_lines, 150);
        assert_eq!(c.max_trait_methods, 12);
        assert_eq!(c.crate_max_files, 75);
        assert_eq!(c.crate_max_lines, 8000);
    }

    #[test]
    fn loads_partial_toml() {
        let dir = std::env::temp_dir().join("baseline-cfg-test");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("baseline.toml"), "max_file_lines = 200\n").unwrap();
        let c = BaselineConfig::load(&dir).unwrap();
        assert_eq!(c.max_file_lines, 200);
        assert_eq!(c.max_trait_methods, 12);
    }
}
