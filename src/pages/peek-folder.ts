import { FileType, read_dir } from "../tauri-api";

type FileDesc = {
	name: string;
	short_path: string;
	full_path: string;
	type: FileType;
};

class PeekFolder {
	base_directory: string;
	directory: string;
	descriptors: FileDesc[];

	constructor() {
		this.base_directory = "C:/Users/josem/Documents/code/tauri/idoru/src";
		this.directory = this.base_directory;
		this.descriptors = [];
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
		event: SubmitEvent | null,
		model: PeekFolder
	) {
		if (event) {
			event.preventDefault();
			model.base_directory = model.directory;
		}
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
						short_path: name,
						full_path: `${dir}/${name}`,
					});
				} break;
				case "directory": {
					directories.push({
						name, type,
						short_path: `${name}/`,
						full_path: `${dir}/${name}`,
					});
				} break;
			}
		}
		const prev = (p => {
			if (p == model.base_directory) return;
			while (p.endsWith("/")) {
				p = p.substring(0, p.length - 1);
			}
			const index = p.lastIndexOf("/");
			if (index < 0) {
				return;
			}
			p = p.substring(0, index);
			if (p.length < model.base_directory.length) return;
			p = p.includes("/") ? p : `${p}/`;
			return p;
		})(model.directory);
		prev && model.descriptors.unshift({
			name: "..",
			type: "directory",
			short_path: "../",
			full_path: prev,
		});

		model.descriptors.push(...directories);
		model.descriptors.push(...files);
	};

	async on_path_button_clicked(
		_event: PointerEvent,
		_bindings: { directory: string, file: FileDesc; },
		target: HTMLButtonElement,
		_event_type: string,
		context: { $parent: { $model: PeekFolder; }; }
	) {
		const model = context.$parent.$model;
		const type = target.dataset.ftype;
		if (!type || type != "directory") {
			return;
		}
		const path = target.dataset.fpath;
		if (!path) {
			return;
		}
		model.directory = path;
		await model.on_submit(null, model);
	}

	static readonly template = `<div class="container">
		<h1>Folder Peeker</h1>
		<form class="row w-full" \${ submit @=> on_submit }>
			<input class="w-full" placeholder="Enter a directory..." \${ value <=> directory } />
			<button type="submit">Peek</button>
		</form>
		<div class="row w-full max-h-full">
			<ul class="left-ul scroll" \${ === found_files }>
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


