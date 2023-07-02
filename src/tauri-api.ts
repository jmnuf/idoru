import { invoke } from "@tauri-apps/api/tauri";


export async function read_dir(dir_path: string) {
	return await invoke("read_dir", {
		dirPath: dir_path,
	}) as [string, "file" | "directory" | "unknown"][];
}
