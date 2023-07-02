import { read_dir } from "../tauri-api";

class PeekFolder {

	get template() {
		return PeekFolder.template;
	}
	static readonly template = `
	<div class="container">
		<h1>Folder Peeker</h1>
	</div>
	`;
}

export function PageModel() {
	return new PeekFolder();
}


const result = await read_file_names("C:/Users/josem/Documents/code/tauri/idoru/src");

console.log(result);

async function read_file_names(path: string, files: string[] = [], prefix: string = "") {
	const result = await read_dir(path);
	if (result == null) {
		console.log("Nothing at", path);
		return files;
	};
	for (const desc of result) {
		if (desc[1] == "unknown") {
			continue;
		}
		const name = `${prefix}${desc[0]}`;
		if (desc[1] == "file") {
			files.push(name);
			continue;
		}
		const new_path = `${path}/${name}`;
		const sub_files = await read_file_names(new_path, files, `${name}/`);
		files.push(...sub_files);
	}
	return files;
}

