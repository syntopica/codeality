use clap::Parser;

pub use crate::baseline_command::BaselineCommand;

/// `cargo baseline` — invoked as a cargo subcommand, so the first
/// user-visible arg is the literal word `baseline`.
#[derive(Parser)]
#[command(name = "cargo-baseline", bin_name = "cargo")]
pub enum Cli {
    #[command(subcommand)]
    Baseline(BaselineCommand),
}
