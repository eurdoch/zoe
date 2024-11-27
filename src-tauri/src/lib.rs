use std::fs::OpenOptions;
use std::io::Write;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![log])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn log(message: String) {
    let home_dir = std::env::var("HOME").expect("Unable to get HOME directory");
    let log_path = format!("{}/.tauri/vitale.log", home_dir);
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .expect("Unable to open log file");

    writeln!(file, "{}", message).expect("Unable to write to log file");
}
