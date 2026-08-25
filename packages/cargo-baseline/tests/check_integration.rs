#![allow(clippy::unwrap_used, clippy::expect_used)]

use std::process::Command;

#[test]
fn check_flags_fixture_project() {
    let fixture = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/bad-crate");
    let out = Command::new(env!("CARGO_BIN_EXE_cargo-baseline"))
        .args(["baseline", "check"])
        .arg(&fixture)
        .output()
        .expect("binary runs");
    let stdout = String::from_utf8_lossy(&out.stdout);
    assert!(!out.status.success());
    assert!(stdout.contains("error[no-inline-sql]"));
    assert!(stdout.contains("error[one-primary-unit]"));
    assert!(stdout.contains("tip[rusqlite]"));
}

#[test]
fn check_reads_cargo_integration_tests_for_sql_only() {
    let fixture = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/bad-crate");
    let out = Command::new(env!("CARGO_BIN_EXE_cargo-baseline"))
        .args(["baseline", "check"])
        .arg(&fixture)
        .output()
        .expect("binary runs");
    let stdout = String::from_utf8_lossy(&out.stdout);

    // The fixture's tests/integration.rs holds an inline CREATE TABLE and two
    // `#[test]` fns. The SQL is reported; the second fn is not.
    assert!(stdout.contains("tests/integration.rs:4: error[no-inline-sql]"));
    assert!(!stdout.contains("tests/integration.rs:11: error[one-primary-unit]"));
}
