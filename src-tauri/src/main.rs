// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod base_dir_reading;
use base_dir_reading::*;
use std::path::Path;
use async_recursion::async_recursion;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
	if name.to_lowercase() == "idoru" {
		return String::from("Hey, we're named the same! I'm also called Idoru!");
	}
	format!("Hello, {}! You've been greeted from Rust!", name)
}


#[tauri::command]
#[async_recursion]
async fn search_dir(dir_path: &str, search_term: &str, show_subpath:bool) -> Result<Option<Vec<(String, String)>>, ()> {
	let dir = read_dir(&dir_path, None).await?;
	let maybe = match dir {
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
			
			#[async_recursion]
			async fn search_iter(list:&mut Vec<(String, String)>, path:&str, name:&str, search_term: &str, show_subpath:bool) -> () {
				let result = search_dir(&path, search_term, show_subpath).await;
				let result = result.unwrap();
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
			}
			for (a, b) in dirs.iter() {
				search_iter(&mut list, &a, &b, search_term, show_subpath).await;
			};
			Some(list)
		}
	};
	Ok(maybe)
}

fn main() {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![
			greet,
			read_dir,
			search_dir,
			filtered_dir_read,
		]).run(tauri::generate_context!())
		.expect("error while running tauri application");
}
