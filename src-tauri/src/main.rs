// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs, path::Path};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
	if name.to_lowercase() == "idoru" {
		return String::from("Hey, we're named the same! I'm also called Idoru!");
	}
	format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_dir(dir_path: &str) -> Option<Vec<(String, String)>> {
	let result = fs::read_dir(dir_path);
	if result.is_err() {
		println!("{:?}", result);
		return None;
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
	
	return Some(dir);
}

#[tauri::command]
fn search_dir(dir_path: &str, search_term: &str, show_subpath:bool) -> Option<Vec<(String, String)>> {
	let dir = read_dir(&dir_path);
	return match dir {
		None => None,
		Some(dir) => {
			let mut dirs:Vec<(String, String)> = Vec::new();
			let mut list:Vec<_> = dir.iter().filter_map(|(fname, ftype)| {
				if ftype != "directory" {
					if fname.contains(search_term) {
						return Some((fname.clone(), ftype.clone()));
					} else {
						return None;
					}
				}
				let dir_path = Path::new(dir_path);
				let new_path = match Path::join(dir_path, fname).into_os_string().into_string() {
					Err(_) => return None,
					Ok(x) => x,
				};
				dirs.push((new_path, fname.clone()));
				return None;
			}).collect();
			dirs.iter().for_each(|(path, name)| {
				let result = search_dir(&path, search_term, show_subpath);
				if result.is_none() {
					return;
				}
				result.unwrap().iter().for_each(|item| {
					if !show_subpath {
						list.push(item.clone());
						return;
					}
					let mut item = item.clone();
					match Path::join(Path::new(name), &item.0).into_os_string().into_string() {
						Err(_) => (),
						Ok(x) => {
							item.0 = x;
						},
					};
					list.push(item);
				});
			});
			Some(list)
		}
	}
}

fn main() {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![greet, read_dir, search_dir])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
