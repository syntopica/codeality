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
