mod check_crate;
mod parse_source_files;
mod partition_by_severity;
mod print_diagnostics;
mod push_tip;
mod run;
mod run_rules;
mod run_tips;
mod select_crate_roots;

pub use run::run;
