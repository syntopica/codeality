use crate::engine::diagnostic::Diagnostic;

pub(super) fn print_diagnostics(errors: &[Diagnostic], tips: &[Diagnostic]) {
    for d in errors {
        println!("{d}");
    }
    println!();
    for d in tips {
        println!("{d}");
    }
    println!("baseline: {} errors, {} tips", errors.len(), tips.len());
}
