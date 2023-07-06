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

export const api = {
	read_dir,
	search_dir,
};

export type FileType = "file" | "directory" | "symlink" | "unknown";
export type DirectoryList = [string, FileType][];
