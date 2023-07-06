// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;

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

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, read_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
