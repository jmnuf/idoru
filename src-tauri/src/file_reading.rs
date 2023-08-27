use std::{fs::File, io::{BufReader, BufRead}, path::PathBuf};

#[tauri::command]
pub async fn read_text_file(file_path: &str) -> Result<Option<Vec<String>>, ()> {
	let file = match File::open(file_path) {
    Ok(f) => f,
    Err(_) => return Ok(None),
	};
	let reader = BufReader::new(file);
	let mut lines = Vec::<String>::new();
	
	for line in reader.lines() {
		if line.is_err() {
			return Ok(None);
		}
		let line = line.unwrap();
		lines.push(line);
	}
	
	return Ok(Some(lines));
}

#[tauri::command]
pub async fn get_file_name(file_path: &str) -> Result<Option<String>, ()> {
	let path = PathBuf::from(file_path);
	match path.file_name() {
  	Some(name) => Ok(Some(name.to_string_lossy().into_owned())),
	  None => Ok(None),
	}
}