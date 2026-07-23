use std::path::PathBuf;

use clap::Subcommand;

#[derive(Subcommand)]
pub enum BaselineCommand {
    /// Run structural rules and tips over a crate or workspace
    Check {
        #[arg(default_value = ".")]
        path: PathBuf,
    },
    /// Scaffold baseline.toml, clippy.toml, rustfmt.toml, deny.toml, toolchain
    Init {
        #[arg(default_value = ".")]
        path: PathBuf,
        /// Also write a GitHub Actions workflow
        #[arg(long)]
        ci: bool,
    },
}
