import { invoke } from "@tauri-apps/api/tauri";

export async function read_dir(dir_path: string): Promise<DirectoryList> {
	return await invoke("read_dir", {
		dirPath: dir_path,
	});
}

export async function search_dir(dir_path: string, search_term: string, show_subpath: boolean = true): Promise<DirectoryList> {
	return await invoke("search_dir", {
		dirPath: dir_path,
		searchTerm: search_term,
		showSubpath: show_subpath,
	});
}

type DirReadFilters = {
	searching: string,
	exclude_files: Array<string>,
	exclude_paths: Array<string>,
};

async function filtered_search(dir_path: string, config: DirReadFilters): Promise<DirectoryList> {
	return await invoke("filtered_dir_read", {
		dirPath: dir_path,
		config
	});
}

export const api = {
	read_dir,
	search_dir,
	filtered_search,
};

export type FileType = "file" | "directory" | "symlink" | "unknown";
export type DirectoryList = [string, FileType][];
