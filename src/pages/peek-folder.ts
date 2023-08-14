import { DirReadFilters, FileType, api } from "../tauri-api";

type FileDesc = {
	name: string;
	short_path: string;
	full_path: string;
	type: FileType;
};

class PeekFolder {
	base_directory: string;
	directory: string;
	private search_config: Required<DirReadFilters>;
	descriptors: FileDesc[];

	constructor() {
		this.base_directory = "./";
		this.directory = this.base_directory;
		this.search_config = {
			searching: "",
			exclude_files: [],
			exclude_paths: [".git", "node_modules", ".vscode"],
			ignore_symlinks: true,
		};
		this.descriptors = [];
	}

	get search_term() {
		return this.search_config.searching;
	}
	set search_term(v: string) {
		this.search_config.searching = v;
		this.on_search_request(null, this);
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

	replace_descriptors(desc: FileDesc): void;
	replace_descriptors(descriptors: FileDesc[]): void;
	replace_descriptors(...descriptors: FileDesc[]): void;
	replace_descriptors(x: FileDesc | FileDesc[], ...y: FileDesc[]) {
		this.descriptors.length = 0;
		if (Array.isArray(x)) {
			this.descriptors.push(...x);
			this.descriptors.map(f => {
				f.short_path = f.short_path.replaceAll("\\", "/");
				f.full_path = f.full_path.replaceAll("\\", "/");
				f.name = f.name.replaceAll("\\", "/");
			});
			return;
		}
		if (!x) {
			return;
		}
		this.descriptors.push(x);
		if (y && Array.isArray(y)) {
			this.descriptors.push(...y);
		}
		this.descriptors.map(f => {
			f.short_path = f.short_path.replaceAll("\\", "/");
			f.full_path = f.full_path.replaceAll("\\", "/");
			f.name = f.name.replaceAll("\\", "/");
		});
	}

	get template() {
		return PeekFolder.template;
	}

	async do_search(set_base_dir: boolean, model: PeekFolder = this) {
		if (set_base_dir) {
			model.base_directory = model.directory;
		}
		if (!model.directory) {
			return;
		}
		model.descriptors.length = 0;
		const dir = model.directory.endsWith("/")
			? model.directory.substring(0, model.directory.length - 1)
			: model.directory;
		const descriptors = await api.read_dir(model.directory, model.search_config);
		// const descriptors = await api.read_dir(model.directory, {
		// 	exclude_files: [],
		// 	exclude_paths: [".git", "node_modules", "target", "build", ".vscode"],
		// });
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
			p = p.includes("/") ? p : `${p}/`;
			if (p.length < model.base_directory.length) return;
			return p;
		})(model.directory);

		prev && directories.unshift({
			name: "..",
			type: "directory",
			short_path: "../",
			full_path: prev,
		});

		model.replace_descriptors(
			...directories,
			...files
		);
		model.directory = dir.lastIndexOf("/") < 0 ? `${dir}/` : dir;
	}

	async on_submit(
		event: SubmitEvent | null,
		_model: PeekFolder
	) {
		if (event) {
			event.preventDefault();
			this.base_directory = this.directory;
		}
		if (this.search_term.trim().length >= 2) {
			await this.on_search_request(null, this);
			return;
		}
		this.do_search(true, this);
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
		await model.do_search(false, model);
	}

	async on_search_request(event: SubmitEvent | null, model: PeekFolder) {
		event?.preventDefault();
		if (model.search_term.trim().length < 2) {
			await model.do_search(false, model);
			return;
		}
		// console.log(arguments);
		const dir = model.directory;
		// const qry = model.search_term;
		const qry = model.search_config;
		// console.log("searching in:", dir);
		// console.log("searching for:", qry);
		// const search_result = await api.search_dir(dir, qry);
		// const search_result = await api.filtered_search(dir, {
		// 	searching: qry,
		// 	exclude_files: [],
		// 	exclude_paths: [".git", ".vscode", "node_modules", "build", "target"]
		// });
		const search_result = await api.filtered_search(dir, qry);
		const directories: FileDesc[] = [];
		const files: FileDesc[] = [];
		for (const desc of search_result) {
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
		model.replace_descriptors(
			...directories,
			...files,
		);
	}

	static readonly template = `<div class="container mx-auto max-h-full">
		<h1>Folder Peeker</h1>
		<form class="row w-full mb-2" \${ submit @=> on_submit }>
			<input class="w-full" placeholder="Enter a directory..." \${ value <=> directory } />
			<button type="submit">👀</button>
		</form>
		<form class="row w-full mb-4" \${ submit @=> on_search_request }>
			<input class="w-full" placeholder="Search..." \${ value <=> search_term } />
			<button type="submit">🔍</button>
		</form>
		<div class="row w-full max-h-full scroll">
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


