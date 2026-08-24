// Pure string formatting with no IO, so running on the main thread costs
// nothing. Anything that touches disk, a DB or the network must be async and
// push the blocking work into spawn_blocking instead.
// baseline:allow sync-tauri-command
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}
