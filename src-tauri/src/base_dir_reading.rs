use std::cmp::Ordering;
use std::{fs, path::Path};
use std::collections::VecDeque;

#[derive(Debug,serde::Deserialize, serde::Serialize)]
pub struct DirReadFilters {
	searching: Option<String>,
	exclude_files: Vec<String>,
	exclude_paths: Vec<String>,
	ignore_symlinks: Option<bool>,
}

#[derive(Debug, serde::Deserialize, serde::Serialize, PartialEq, Eq, Clone)]
pub enum IdoruFileType {
	File,
	Directory,
	Symlink,
	Unknown,
}

impl PartialOrd for IdoruFileType {
	fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
		let order = match (self, other) {
			(IdoruFileType::File, IdoruFileType::Directory) => Ordering::Less,
			(IdoruFileType::File, IdoruFileType::Symlink) => Ordering::Equal,
			(IdoruFileType::File, IdoruFileType::Unknown) => Ordering::Greater,
			(IdoruFileType::Symlink, IdoruFileType::File) => Ordering::Equal,
			(IdoruFileType::Symlink, IdoruFileType::Directory) => Ordering::Less,
			(IdoruFileType::Symlink, IdoruFileType::Unknown) => Ordering::Greater,
			(IdoruFileType::Directory, _) => Ordering::Greater,
			(IdoruFileType::Unknown, _) => Ordering::Less,
			_ => Ordering::Equal
		};
		return Some(order);
	}
}

impl Ord for IdoruFileType {
	fn cmp(&self, other: &Self) -> std::cmp::Ordering {
		match (self, other) {
			(IdoruFileType::File, IdoruFileType::Directory) => Ordering::Less,
			(IdoruFileType::File, IdoruFileType::Symlink) => Ordering::Equal,
			(IdoruFileType::File, IdoruFileType::Unknown) => Ordering::Greater,
			(IdoruFileType::Symlink, IdoruFileType::File) => Ordering::Equal,
			(IdoruFileType::Symlink, IdoruFileType::Directory) => Ordering::Less,
			(IdoruFileType::Symlink, IdoruFileType::Unknown) => Ordering::Greater,
			(IdoruFileType::Directory, _) => Ordering::Greater,
			(IdoruFileType::Unknown, _) => Ordering::Less,
			_ => Ordering::Equal
		}
	}
}

#[tauri::command]
pub async fn read_dir(dir_path: &str, config: Option<DirReadFilters>) -> Result<Option<Vec<(String, IdoruFileType)>>, ()> {
	let result = fs::read_dir(dir_path);
	if result.is_err() {
		println!("{:?}", result);
		return Ok(None);
	}
	let result = result.unwrap();
	let dir:Vec<(String, IdoruFileType)> = result.into_iter().filter_map(|f| {
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
				if config.is_some() {
					let cfg = config.as_ref().unwrap();
					if cfg.exclude_files.contains(&fname) {
						return None;
					}
				}
				
				IdoruFileType::File
			} else if meta.is_dir() {
				if config.is_some() {
					let cfg = config.as_ref().unwrap();
					if cfg.exclude_paths.contains(&fname) {
						return None;
					}
				}
				
                IdoruFileType::Directory
			} else if meta.is_symlink() {
				if config.is_some() {
					let cfg = config.as_ref().unwrap();
					if let Some(true) = cfg.ignore_symlinks {
						return None;
					}
				}
				
                IdoruFileType::Symlink
			} else {
                IdoruFileType::Unknown
			};
			Some((fname, ftype))
		} else {
			None
		}
	}).collect();
	
	return Ok(Some(dir));
}

#[tauri::command]
pub async fn filtered_dir_read(dir_path: String, config: DirReadFilters) -> Result<Option<Vec<(String, IdoruFileType, String)>>, ()> {
	let base_path = dir_path.clone();
	let mut paths = VecDeque::new(); //vec![dir_path];
	let mut filtered_contents:Vec<_> = Vec::new();
	paths.push_front(dir_path);
	
	while let Some(dir_path) = paths.pop_front() {
		let result = fs::read_dir(dir_path.clone());
		if result.is_err() {
			println!("{:?}", result);
			println!("{}", dir_path);
			continue;
		}
		let result = result.unwrap();
		let local_dir:Vec<_> = result.into_iter().filter_map(|f| {
			if f.is_err() {
				return None;
			}
			let entry = f.unwrap();
			let base_name:String = match entry.file_name().into_string() {
				Err(_) => return None,
				Ok(x) => x,
			};
			let mut fname = if dir_path == base_path {
				base_name.clone()
			} else {
				match Path::new(&dir_path).join(&base_name).into_os_string().into_string() {
					Err(_) => return None,
					Ok(x) => x,
				}
			};
			let meta = match entry.metadata() {
					Err(_) => return None,
					Ok(x) => x,
			};
			let ftype = if meta.is_file() {
				if config.exclude_files.contains(&fname) || config.exclude_files.contains(&base_name) {
					return None;
				}
				if config.searching.is_some() && !fname.contains(config.searching.as_ref().unwrap()) {
					return None;
				}

				IdoruFileType::File
			} else if meta.is_dir() {
				if config.exclude_paths.contains(&fname) || config.exclude_paths.contains(&base_name) {
					return None;
				}
				if base_path == dir_path {
					fname = match Path::new(&base_path).join(&fname).into_os_string().into_string() {
						Err(_) => return None,
						Ok(x) => x,
					};
				}

				IdoruFileType::Directory
			} else if meta.is_symlink() {
				if config.ignore_symlinks == Some(true) {
					return None;
				}
				if config.searching.is_some() && !fname.contains(config.searching.as_ref().unwrap()) {
					return None;
				}

				IdoruFileType::Symlink
			} else {
				IdoruFileType::Unknown
			};
			if fname.contains("\\") {
				fname = fname.replace("\\", "/");
			}
			Some((fname, ftype, base_name))
		}).collect();
		
		for (a, b, c) in local_dir.iter() {
			if b.clone() == IdoruFileType::Directory {
				paths.push_back(a.to_owned());
			} else {
				filtered_contents.push((a.to_owned(), b.to_owned(), c.to_owned()));
			}
		}
	}

	if config.searching.is_none() || config.searching.unwrap().is_empty() {
		filtered_contents.sort_by_cached_key(|x| x.0.clone());
		filtered_contents.sort_by(|a, b| {
			return a.1.cmp(&b.1);
		});
	}
	
	return Ok(Some(filtered_contents));
}
