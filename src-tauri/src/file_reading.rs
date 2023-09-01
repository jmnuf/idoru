use std::{fs::File, io::{BufReader, BufRead, Read}, path::PathBuf};

#[tauri::command]
pub async fn read_text_file(file_path: &str) -> Result<Option<Vec<String>>, ()> {
	let file = match File::open(file_path) {
    Ok(f) => f,
    Err(e) => {
			eprintln!("{:?}", e);
			return Ok(None);
		},
	};
	let reader = BufReader::new(file);
	let mut lines = Vec::<String>::new();
	
	for line in reader.lines() {
		if line.is_err() {
			unsafe {
				eprintln!("{:?}", line.unwrap_err_unchecked());
			}
			return Ok(None);
		}
		let line = line.unwrap();
		lines.push(line);
	}
	
	return Ok(Some(lines));
}

#[tauri::command]
pub fn is_file_openable_as_text(file_path: &str) -> bool {
	match File::open(file_path) {
		Ok(mut f) => {
			let mut buffer = String::new();
			match f.read_to_string(&mut buffer) {
				Ok(_) => true,
				Err(_) => false,
			}
		},
		Err(_) => false,
	}
}

#[tauri::command]
pub async fn get_file_name(file_path: &str) -> Result<Option<String>, ()> {
	let path = PathBuf::from(file_path);
	match path.file_name() {
  	Some(name) => Ok(Some(name.to_string_lossy().into_owned())),
	  None => Ok(None),
	}
}
