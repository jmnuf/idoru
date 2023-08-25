import { formInput, type InputModel } from "../components/form";
import { BroomImg } from "../components/templating/broom-img";
import { DragonImg } from "../components/templating/dragon-img";
import { DirReadFilters, FileType, api } from "../tauri-api";

type FileDesc = {
	name: string;
	short_path: string;
	full_path: string;
	type: FileType;
};

class UpdatedOptionsEvent extends CustomEvent<{ excluded_files: string[], excluded_folders: string[], ignores_symlinks: boolean; }> {
	constructor(excluded_files: string[], excluded_folders: string[], ignores_symlinks: boolean) {
		super("updated_options", {
			bubbles: true, cancelable: false, detail: {
				excluded_files, excluded_folders, ignores_symlinks
			}
		});
	}
}

class SearchConfigPopupModel {
	declare elem: HTMLDialogElement;

	excluded_files: string[];
	excluded_folders: string[];
	ignores_symlinks: boolean;
	inputs: [
		InputModel<"text", {}>,
		InputModel<"text", {}>,
		InputModel<"checkbox", {}>,
	];

	constructor() {
		this.excluded_files = [];
		this.excluded_folders = [];
		this.ignores_symlinks = true;
		this.inputs = [
			formInput("exclude files", "text", {}),
			formInput("exclude folders", "text", {}),
			formInput("ignore symlinks", "checkbox", {}),
		];
	}

	async _on_submit(
		submit_event: SubmitEvent,
		_model: SearchConfigPopupModel
	) {
		if (!submit_event.submitter) {
			console.log("Closed by non-button");
			return;
		}
		const submitter = submit_event.submitter as HTMLInputElement;
		console.log("Closed by button:", submitter.value);
		if (submitter.value != "accept") {
			return;
		}

		const event = new UpdatedOptionsEvent(this.excluded_files, this.excluded_folders, this.ignores_symlinks);
		this.elem.dispatchEvent(event);
	}

	open_dialog() {
		this.inputs[0].element.value = this.excluded_files.join(", ");
		this.inputs[1].element.value = this.excluded_folders.join(", ");
		this.inputs[2].element.checked = this.ignores_symlinks;
		this.elem.showModal();
	}

	close_dialog() {
		this.elem.close("cancel");
	}

	get template() {
		return SearchConfigPopupModel.template;
	}

	static readonly template = `<dialog \${ ==> elem } >
		<form class="flex flex-col" method="dialog" \${ submit @=> _on_submit }>
			<div class="flex flex-col-reverse mb-2">
				<\${ inp === } \${ inp <=* inputs }>
			</div>
			<div class="flex flex-row w-full justify-center">
				<input type="submit" value="accept" />
				<input type="submit" value="cancel" />
			</div>
		</form>
	</dialog>`;
}

class PeekFolder {
	base_directory: string;
	directory: string;
	private search_config: Required<DirReadFilters>;
	descriptors: FileDesc[];
	search_options_dialog: SearchConfigPopupModel;

	constructor() {
		this.base_directory = "./";
		this.directory = this.base_directory;
		this.descriptors = [];
		const config = {
			searching: "",
			exclude_files: [],
			exclude_paths: [".git", "node_modules", ".vscode"],
			ignore_symlinks: true,
		};

		const search_options_dialog = new SearchConfigPopupModel();
		search_options_dialog.excluded_folders = config.exclude_paths;
		search_options_dialog.excluded_files = config.exclude_files;
		search_options_dialog.ignores_symlinks = config.ignore_symlinks;
		this.search_options_dialog = search_options_dialog;
		Object.defineProperties(config, {
			exclude_files: {
				get() {
					return search_options_dialog.excluded_files;
				},
				set(v: string[]) {
					search_options_dialog.excluded_files = v;
				},
			},
			exclude_paths: {
				get() {
					return search_options_dialog.excluded_folders;
				},
				set(v: string[]) {
					search_options_dialog.excluded_folders = v;
				},
			},
			ignore_symlinks: {
				get() {
					return search_options_dialog.ignores_symlinks;
				},
				set(v) {
					if (typeof v != "boolean") {
						throw new TypeError("Property 'ignore_symlinks' can only be boolean");
					}
					search_options_dialog.ignores_symlinks = v;
				},
			}
		});

		this.search_config = config;
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
		const qry = model.search_config;
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

	async on_open_configs(event: SubmitEvent) {
		event.preventDefault();
		this.search_options_dialog.open_dialog();
	}

	async on_updated_options(event: UpdatedOptionsEvent) {
		console.log(event);
		// TODO: update options received by event?
	}

	static readonly template = `<div class="container mx-auto max-h-full">
		<h1>Folder Peeker</h1>
		<form class="row w-full mb-2" \${ submit @=> on_submit }>
			<input class="w-full" placeholder="Enter a directory..." \${ value <=> directory } />
			<button type="submit">
				${DragonImg(30)}
			</button>
		</form>
		<form class="row w-full mb-4" \${ updated_options @=> on_updated_options } \${ submit @=> on_open_configs }>
			<input class="w-full" placeholder="Search..." \${ value <=> search_term } />
			<button type="submit">
				${BroomImg(30)}
			</button>
			<\${ search_options_dialog === } />
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


