pub mod commands;

pub fn run() {
    if let Err(e) = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![commands::greet::greet])
        .run(tauri::generate_context!())
    {
        eprintln!("tauri error: {e}");
        std::process::exit(1);
    }
}
