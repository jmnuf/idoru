// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod base_dir_reading;
mod file_reading;
mod file_writing;

use base_dir_reading::*;
use file_reading::*;
use file_writing::*;

use std::io::{BufWriter, Write, Read};
use tauri::Manager;
use std::path::{Path, PathBuf};
use std::fs::OpenOptions;
use std::{fs, sync::Mutex, ops::Deref};
use serde::{Serialize, Deserialize};
use async_recursion::async_recursion;

pub struct ManagedAppState(Mutex<AppState>);
#[derive(Serialize, Deserialize, Debug)]
pub struct AppState {
    last_file: Option<AppFile>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AppFile {
    file_name: String,
    file_contents: Vec<String>,
}

type ManagedState<'a> = tauri::State<'a, ManagedAppState>;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
	if name.to_lowercase() == "idoru" {
		return String::from("Hey, we're named the same! I'm also called Idoru!");
	}
	format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn relative_to_full_path(relative_path: String) -> Option<String> {
	match fs::canonicalize(relative_path) {
		Ok(path) => {
			match path.as_os_str().to_owned().into_string() {
				Err(_) => None,
				Ok(path) => Some(path),
			}
		},
		Err(err) => {
			eprintln!("{:?}", err);
			None
		}
	}
}

#[tauri::command]
#[async_recursion]
async fn search_dir(dir_path: &str, search_term: &str, show_subpath:bool) -> Result<Option<Vec<(String, IdoruFileType)>>, ()> {
	let dir = read_dir(&dir_path, None).await?;
	let maybe = match dir {
		None => None,
		Some(dir) => {
			let mut dirs:Vec<(String, String)> = Vec::new();
			let mut list:Vec<_> = dir.iter().filter_map(|(fname, ftype)| {
				if ftype != &IdoruFileType::Directory {
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
			async fn search_iter(list:&mut Vec<(String, IdoruFileType)>, path:&str, name:&str, search_term: &str, show_subpath:bool) -> () {
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

#[tauri::command]
fn get_last_file(mstate: tauri::State<ManagedAppState>) -> Option<AppFile> {
    let state = match mstate.0.lock() {
        Err(_) => return None,
        Ok(s) => s,
    };
    return match &state.last_file {
        None => None,
        Some(x) => Some(x.clone()),
    };
}

#[tauri::command]
fn set_last_file(file_name: String, file_contents: Vec<String>, app_handle: tauri::AppHandle, mstate: tauri::State<ManagedAppState>) -> bool {
    {
        let mut state = match mstate.0.lock() {
            Err(_) => return false,
            Ok(s) => s,
        };
        state.last_file = Some(AppFile { file_name, file_contents });
    };
    let paths = app_handle.path_resolver();
    match paths.app_data_dir() {
        None => (),
        Some(data_path) => {
            let _ = save_current_app_state(data_path, mstate);
        }
    };
    return true;
}

#[tauri::command]
fn check_saved_last_file(app_handle: tauri::AppHandle, mstate: tauri::State<ManagedAppState>) -> bool {
    let paths = app_handle.path_resolver();
    return match paths.app_data_dir() {
        None => false,
        Some(path) => {
            let file_path = path.join("scales.json");
            use std::fs::OpenOptions;
            if !file_path.exists() {
                let mut file = match OpenOptions::new()
                    .write(true)
                    .create(true)
                    .open(file_path) {
                        Err(_) => return false,
                        Ok(x) => x,
                };
                match mstate.0.lock() {
                    Err(_) => {
                        let _ = file.write(b"{}");
                    }
                    Ok(state) => {
                        let writer = BufWriter::new(file);
                        let _ = serde_json::to_writer(writer, &state.deref());
                    }
                };
                return false;
            }
            return true;
        },
    };
}

fn save_current_app_state(app_data_path: PathBuf, mstate: ManagedState) -> Option<()> {
    let file_path = app_data_path.join("scales.json");
    let file = match OpenOptions::new()
        .write(true).create(true)
        .open(file_path) {
            Err(_) => return None,
            Ok(x) => x,
    };

    let state = match mstate.0.lock() {
        Err(_) => return None,
        Ok(x) => x,
    };
    let writer = BufWriter::new(file);

    return match serde_json::to_writer(writer, &state.deref()) {
        Err(_) => None,
        Ok(_) => Some(()),
    };
}

fn load_saved_last_file(app_data_path: PathBuf) -> Option<AppState> {
    let file_path = app_data_path.join("scales.json");
    let mut contents = String::new();
    let mut file = match std::fs::File::open(file_path) {
        Err(_) => return None,
        Ok(x) => x,
    };
    match file.read_to_string(&mut contents) {
        Err(_) => None,
        Ok(_) => {
            let state:AppState = match serde_json::from_str(&contents) {
                Err(_) => return None,
                Ok(v) => v,
            };

            Some(state)
        },
    }
}


fn main() {
	tauri::Builder::default()
        .manage(ManagedAppState(Mutex::new(AppState{ last_file: None })))
		.setup(|app| {
            let paths = app.path_resolver();
            match paths.app_data_dir() {
                None => (),
                Some(path) => {
                    if !path.is_dir() {
                        let _ = std::fs::create_dir_all(path);
                    } else {
                        match load_saved_last_file(path) {
                            None => (),
                            Some(saved_state) => {
                                let mstate:tauri::State<ManagedAppState> = app.state();
                                let mut state = mstate.0.lock().unwrap();
                                *state = saved_state;
                            },
                        };
                    }
                }
            };

			#[cfg(debug_assertions)]
			app.get_window("main").unwrap().open_devtools();
			Ok(())
		})
		.invoke_handler(tauri::generate_handler![
			greet,
            get_last_file,
            check_saved_last_file,
            set_last_file,
			read_dir,
			search_dir,
			filtered_dir_read,
			relative_to_full_path,
			read_text_file,
			write_to_file,
			is_file_openable_as_text,
			get_file_name,
		]).run(tauri::generate_context!())
		.expect("error while running tauri application");
}
