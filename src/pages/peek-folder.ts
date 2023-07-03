import { read_dir } from "../tauri-api";

type FileDesc = {
	name: string;
	short_path: string;
	full_path: string;
	type: "file" | "directory";
};

class PeekFolder {
	directory: string | undefined;
	descriptors: FileDesc[];

	constructor() {
		this.directory = "C:/Users/josem/Documents/code/tauri/idoru/src";
		this.descriptors = [];
		// @ts-ignore
		this._on_submit = (e, m) => this.on_submit(e, m);
	}

	get found_files() {
		return this.descriptors.length > 0 && this.directory != null;
	}

	get file_paths() {
		const paths: string[] = [];
		for (const desc of this.descriptors) {
			if (desc.type == "directory") {
				paths.push(`./${desc.name}/`);
			} else {
				paths.push(`./${desc.name}`);
			}
		}
		return paths;
	}

	get template() {
		return PeekFolder.template;
	}
	async on_submit(
		event: SubmitEvent,
		model: PeekFolder
	) {
		console.log(arguments);
		event.preventDefault();
		if (!model.directory) {
			return;
		}
		model.descriptors.length = 0;
		const dir = model.directory.endsWith("/")
			? model.directory.substring(0, model.directory.length - 1)
			: model.directory;
		const descriptors = await read_dir(model.directory);
		const directories: FileDesc[] = [];
		const files: FileDesc[] = [];
		for (const desc of descriptors) {
			const name = desc[0];
			const type = desc[1];
			if (type == "unknown") {
				continue;
			}
			switch (type) {
				case "file": {
					files.push({
						name, type,
						short_path: `./${name}`,
						full_path: `${dir}/${name}`,
					});
				} break;
				case "directory": {
					directories.push({
						name, type,
						short_path: `./${name}/`,
						full_path: `${dir}/${name}`,
					});
				} break;
			}
		}
		model.descriptors.push(...directories);
		model.descriptors.push(...files);
	};

	async on_path_button_clicked(
		event: PointerEvent,
		ctx_model: { directory: string, file: FileDesc; },
		target: HTMLButtonElement,
		event_type: string,
		context: { $parent: { $model: PeekFolder; }; }
	) {
		const model = context.$parent.$model;
		const type = target.dataset.ftype;
		console.log("Type:", type);
		if (!type || type != "directory") {
			return;
		}
		const path = target.dataset.fpath;
		console.log("Path:", path);
		if (!path) {
			return;
		}
		model.directory = path;
		// model.on_submit(event, ctx_model, target, event_type, context);
	}

	static readonly template = `<div class="container">
		<h1>Folder Peeker</h1>
		<form class="row w-full" \${ submit @=> on_submit }>
			<input class="w-full" placeholder="Enter a directory..." \${ value <=> directory } />
			<button type="submit">Peek</button>
		</form>
		<div class="row w-full">
			<ul class="left-ul" \${ === found_files }>
				<li \${ file <=* descriptors }>
					<button data-fpath="\${file.full_path}" data-ftype="\${file.type}" \${ click @=> on_path_button_clicked }>
						\${ file.short_path }
					</button>
				</li>
			</ul>
		</div>
	</div>`;
}

export function PageModel() {
	return new PeekFolder();
}


// const result = await read_file_names("C:/Users/josem/Documents/code/tauri/idoru/src");
// console.log(result);

// async function read_file_names(path: string, files: string[] = [], prefix: string = "") {
// 	const result = await read_dir(path);
// 	if (result == null) {
// 		console.log("Nothing at", path);
// 		return files;
// 	};
// 	for (const desc of result) {
// 		if (desc[1] == "unknown") {
// 			continue;
// 		}
// 		const name = `${prefix}${desc[0]}`;
// 		if (desc[1] == "file") {
// 			files.push(name);
// 			continue;
// 		}
// 		const new_path = `${path}/${name}`;
// 		const sub_files = await read_file_names(new_path, files, `${name}/`);
// 		files.push(...sub_files);
// 	}
// 	return files;
// }

