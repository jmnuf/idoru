import { ExtraParams, missNorishre } from "@jmnuf/norishre";
import { UI } from "@peasy-lib/peasy-ui";
import create_navbar from "./components/navbar";
import { invoke } from "@tauri-apps/api/tauri";
import { PageChangeEvent } from "./page-change-event";
import type { FileViewModel } from "./pages/file-view";
import { api } from "./tauri-api";
import { KeyOf } from "@jmnuf/norishre/dist/base-types";

const norishre = missNorishre({
	index: {
		path: "/",
		model: async () => {
			const { PageModel } = await import("./pages/index");
			const model = PageModel();
			return model;
		},
	},
	peekFolder: {
		path: "/peeker",
		model: async () => {
			const { PageModel } = await import("./pages/peek-folder");
			const model = PageModel();
			try {
				let path = await invoke<string>("relative_to_full_path", { relativePath: "./" });
				console.log("Transforming", "'./'", "to", path);
				if (typeof path == "string") {
					// Hit this in windows no idea what it is but it's ugly
					if (path.startsWith("\\\\?\\")) {
						path = path.replace("\\\\?\\", "");
					}
					path = path.replace(/\\/g, "/");
					model.base_directory = path;
					model.directory = path;
				}
			} catch (err) {
				console.error(err);
			}
			model.do_search(false);
			return model;
		}
	},
	fileViewer: {
		path: "/reader",
		model: async () => {
			const { PageModel } = await import("./pages/file-view");
			const model = PageModel();
			return model;
		},
	},
	fileEditor: {
		path: "/editor",
		model: async () => {
			const { PageModel } = await import("./pages/file-edit");
			const model = PageModel();
			return model;
		}
	}
});

type FileHandlerModel = {
	open_file(file_name: string, file_path: string): Promise<void>;
};

async function on_file_handler_pulled({ model, params }: { model: FileHandlerModel, params: ExtraParams; }) {
	if (!model) {
		const arrow_id = norishre.find_arrow_id_by_url()[0] as KeyOf<typeof norishre.models>;
		if (norishre.is_model_loading(arrow_id)) {
			await norishre.loadDrawnArrow();
		}
		// @ts-expect-error
		model = norishre.models[arrow_id];
		console.log(arrow_id, model);
	}
	const model_name = Object.getPrototypeOf(model).constructor.name;
	console.log("Opening", model_name);

	if (!params) {
		console.warn(`Not updating ${model_name} cause of lack of params`);
		return;
	}
	if (params.query && "file_path" in params.query) {
		if (Array.isArray(params.query.file_path)) {
			params.query.file_path = params.query.file_path[0];
		}
		const fpath = params.query.file_path;
		if (typeof fpath != "string") {
			console.error("Expected path to be a string but got", typeof fpath);
			return;
		}
		const contents = await api.read_text_file(params.query.file_path);
		if (!contents) {
			console.error("Failed to read file:", fpath);
		}
		const fname = typeof params.query.file_name == "string" ? params.query.file_name : fpath.substring(Math.max(fpath.lastIndexOf("\\"), fpath.lastIndexOf("/")));
		console.log("Opening file: ", fname);
		model.open_file(fname, fpath);
	}
}

// @ts-expect-error on_pulled is still not actually available through missNorishre fn
norishre.quiver.fileViewer.on_pulled = on_file_handler_pulled;
// @ts-expect-error on_pulled is still not actually available through missNorishre fn
norishre.quiver.fileEditor.on_pulled = on_file_handler_pulled;

export type AppRouter = typeof norishre;

const navbar = create_navbar(norishre);
navbar.add_page("index", "Home");
navbar.add_page("peekFolder", "Peeker");
navbar.add_page("fileViewer", "Reader");
navbar.add_page("fileEditor", "Writer");
UI.create(document.body, navbar, navbar.template);

const [active_id, params] = norishre.find_arrow_id_by_url();

console.log("Found arrow data:", { active_id, params });

// @ts-expect-error page-change is an irregular event with a custom event
document.addEventListener("page-change", (ev: PageChangeEvent) => {
	if (ev.defaultPrevented) {
		return;
	}
	const arrow = ev.detail.arrow;
	const params = ev.detail.params;
	console.log("path", norishre.arrow_path(arrow, params));
	console.log("params", params);
	norishre.pull_from_quiver(arrow, params);
});

norishre.pull_from_quiver(active_id as any, params).then(() => load_page());

async function load_page() {
	if (!norishre.pulled_arrow) {
		setTimeout(load_page, 100);
		return;
	}

	UI.create(document.body, norishre, norishre.template);
	console.log("Loaded model for arrow with id", active_id);
}
