use std::{fs, path::Path};

#[tauri::command]
pub async fn read_dir(dir_path: &str) -> Result<Option<Vec<(String, String)>>, ()> {
	let result = fs::read_dir(dir_path);
	if result.is_err() {
		println!("{:?}", result);
		return Ok(None);
	}
	let result = result.unwrap();
	let dir:Vec<(String, String)> = result.into_iter().filter_map(|f| {
		if f.is_ok() {
			let entry = f.unwrap();
			let fname:String = match entry.file_name().into_string() {
				Err(_) => return None,
				Ok(x) => x,
			};
			let meta = match entry.metadata() {
					Err(_) => return None,
					Ok(x) => x,
			};
			let ftype = if meta.is_file() {
				String::from("file")
			} else if meta.is_dir() {
				String::from("directory")
			} else if meta.is_symlink() {
				String::from("symlink")
			} else {
				String::from("unknown")
			};
			Some((fname, ftype))
		} else {
			None
		}
	}).collect();
	
	return Ok(Some(dir));
}

#[derive(Debug,serde::Deserialize, serde::Serialize)]
pub struct DirReadFilters {
	searching: String,
	exclude_files: Vec<String>,
	exclude_paths: Vec<String>,
	ignore_symlinks: Option<bool>,
}

#[tauri::command]
pub async fn filtered_dir_read(dir_path: String, config: DirReadFilters) -> Result<Option<Vec<(String, String)>>, ()> {
	let base_path = dir_path.clone();
	let mut paths = vec![dir_path];
	let mut dir:Vec<_> = Vec::new();
	
	while let Some(dir_path) = paths.first() {
		let result = fs::read_dir(dir_path.clone());
		if result.is_err() {
			println!("{:?}", result);
			println!("{}", dir_path);
			paths.remove(0);
			continue;
		}
		let result = result.unwrap();
		let local_dir:Vec<(String, String)> = result.into_iter().filter_map(|f| {
			if f.is_err() {
				return None;
			}
			let entry = f.unwrap();
			let mut fname:String = match entry.file_name().into_string() {
				Err(_) => return None,
				Ok(base_name) => {
					if dir_path == &base_path {
						base_name
					} else {
						match Path::new(&dir_path).join(&base_name).into_os_string().into_string() {
							Err(_) => return None,
							Ok(x) => x,
						}
					}
				},
			};
			let meta = match entry.metadata() {
					Err(_) => return None,
					Ok(x) => x,
			};
			let ftype = if meta.is_file() {
				if config.exclude_files.contains(&fname) {
					return None;
				}
				if !fname.contains(&config.searching) {
					return None;
				}

				String::from("file")
			} else if meta.is_dir() {
				if config.exclude_paths.contains(&fname) {
					return None;
				}
				if &base_path == dir_path {
					fname = match Path::new(&base_path).join(&fname).into_os_string().into_string() {
						Err(_) => return None,
						Ok(x) => x,
					};
				}

				String::from("directory")
			} else if meta.is_symlink() {
				if config.ignore_symlinks == Some(true) {
					return None;
				}
				if !fname.contains(&config.searching) {
					return None;
				}

				String::from("symlink")
			} else {
				String::from("unknown")
			};
			if fname.contains("\\") {
				fname = fname.replace("\\", "/");
			}
			Some((fname, ftype))
		}).collect();
		
		paths.remove(0);
		
		for (a, b) in local_dir.iter() {
			if b.clone() == String::from("directory") {
				paths.push(a.to_owned());
			} else {
				dir.push((a.to_owned(), b.to_owned()));
			}
		}
	}

	return Ok(Some(dir));
}