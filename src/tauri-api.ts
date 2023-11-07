import { invoke } from "@tauri-apps/api/tauri";

export type FileType = "File" | "Directory" | "Symlink" | "Unknown";
export type DirectoryList = [string, FileType][];

export async function read_dir(dir_path: string, cfg?: DirReadFilters): Promise<DirectoryList> {
	return await invoke("read_dir", {
		dirPath: dir_path,
		config: cfg,
	});
}

export async function search_dir(dir_path: string, search_term: string, show_subpath: boolean = true): Promise<DirectoryList> {
	return await invoke("search_dir", {
		dirPath: dir_path,
		searchTerm: search_term,
		showSubpath: show_subpath,
	});
}

export type DirReadFilters = {
	searching?: string,
	exclude_files: string[],
	exclude_paths: string[],
	ignore_symlinks?: boolean;
};

type IdoruDirectory = [string, FileType, string];

async function filtered_search(dir_path: string, config: DirReadFilters): Promise<IdoruDirectory[]> {
	return await invoke("filtered_dir_read", {
		dirPath: dir_path,
		config
	});
}

async function read_text_file(file_path: string): Promise<string[] | undefined> {
	const file_contents = await invoke<string[] | undefined>("read_text_file", {
		filePath: file_path,
	});
	return file_contents;
}

async function get_file_name(file_path: string): Promise<string | undefined> {
	return await invoke("get_file_name", {
		filePath: file_path,
	});
}

async function is_openable_as_text(file_path: string): Promise<boolean> {
	return await invoke<boolean>("is_file_openable_as_text", {
		filePath: file_path,
	});
}

async function write_to_file(file_path: string, file_contents: string): Promise<boolean> {
	return await invoke<boolean>("write_to_file", {
		filePath: file_path,
		contents: file_contents,
	});
}

type LastSavedFileInfo = {
	file_name: string;
	file_contents: string[];
	file_path: string;
};

async function get_last_file() {
	return await invoke<LastSavedFileInfo | null>("get_last_file");
}

async function check_for_last_file() {
	return await invoke<boolean>("check_saved_last_file");
}

async function set_last_file(file_name: string, file_contents: string[], file_path: string) {
	return await invoke<boolean>("set_last_file", {
		fileName: file_name,
		fileContents: file_contents,
		filePath: file_path,
	});
}

(async () => {
	console.log("last checked app file", await get_last_file());
	console.log("state file exists", await check_for_last_file());
})()

export const api = {
	read_dir,
	search_dir,
	
	get_last_file,
	check_for_last_file,
	set_last_file,

	filtered_search,
	is_openable_as_text,
	read_text_file,
	write_to_file,
	get_file_name,
};

// @ts-ignore
window.API = api;

