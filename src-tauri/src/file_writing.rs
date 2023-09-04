use std::fs;


#[tauri::command]
pub async fn write_to_file(file_path: &str, contents: &str) -> Result<bool, ()> {
	let success = match fs::write(file_path, contents) {
		Err(_) => false,
		Ok(_) => true,
	};
	Ok(success)
}
