mod cli;
mod commands;
mod config;
mod engine;
mod rules;
mod tips;

use clap::Parser;

fn main() -> anyhow::Result<()> {
    let cli::Cli::Baseline(cmd) = cli::Cli::parse();
    match cmd {
        cli::BaselineCommand::Check { path } => commands::check::run(&path),
        cli::BaselineCommand::Init { path, ci } => commands::init::run(&path, ci),
    }
}
