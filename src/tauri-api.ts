import { invoke } from "@tauri-apps/api/tauri";


export async function read_dir(dir_path: string): Promise<DirectoryList> {
	return await invoke("read_dir", {
		dirPath: dir_path,
	});
}

export type FileType = "file" | "directory" | "symlink" | "unknown";
export type DirectoryList = [string, FileType][];
