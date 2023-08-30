import { invoke } from "@tauri-apps/api/tauri";

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

export const api = {
	read_dir,
	search_dir,
	filtered_search,
	read_text_file,
	get_file_name,
};

// @ts-ignore
window.API = api;

export type FileType = "file" | "directory" | "symlink" | "unknown";
export type DirectoryList = [string, FileType][];
