use std::path::PathBuf;

use clap::{Parser, Subcommand};

/// `cargo baseline` — invoked as a cargo subcommand, so the first
/// user-visible arg is the literal word `baseline`.
#[derive(Parser)]
#[command(name = "cargo-baseline", bin_name = "cargo")]
pub enum Cli {
    #[command(subcommand)]
    Baseline(BaselineCommand),
}

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
