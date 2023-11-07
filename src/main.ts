import { ExtraParams, missNorishre } from "@jmnuf/norishre";
import { UI, UIView } from "@peasy-lib/peasy-ui";
import create_navbar from "./components/navbar";
import { invoke } from "@tauri-apps/api/tauri";
import { api } from "./tauri-api";
import { KeyOf } from "@jmnuf/norishre/dist/base-types";

const Norishre = () => missNorishre({
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
	file_path: string;
	open_file(file_name: string, file_path: string): Promise<void>;
	update_contents(): Promise<void>;
};



export type AppRouter = ReturnType<typeof Norishre>;
export type AppQuiver = AppRouter["quiver"];
export type AppArrows = Exclude<KeyOf<AppRouter["quiver"]>, `%${string}%`>;



class App {
	private norishre: AppRouter;
	private navbar: ReturnType<typeof create_navbar<AppQuiver>>;
	private view?: UIView;
	private view_is_attached: boolean;
	private file_path: string;

	constructor() {
		this.norishre = Norishre();
		this.navbar = create_navbar(this.norishre);
		this.view_is_attached = false;
		this.file_path = "";
	}

	async init() {
		if (this.view) {
			return;
		}
		const [active_id, params] = this.norishre.find_arrow_id_by_url();
		await this.norishre.pull_from_quiver(active_id as AppArrows, params);
		console.log("Pulling initial arrow data:", { active_id, params });

		this.navbar.add_page("index", "Home");
		this.navbar.add_page("peekFolder", "Peeker");
		this.navbar.add_page("fileViewer", "Reader");
		this.navbar.add_page("fileEditor", "Writer");

		this.view_is_attached = false;
		this.view = UI.create(document.body, this, App.template);
		await this.view.attached;
		this.view_is_attached = true;

		this.setup_event_listeners();

		this.setup_norishre_handlers();
	}

	private setup_event_listeners(): void {
		document.addEventListener("idoru:page-change", (ev) => {
			if (ev.defaultPrevented) {
				return;
			}
			const arrow = ev.detail.arrow;
			const params = ev.detail.params;
			console.log("path", this.norishre.arrow_path(arrow, params));
			console.log("params", params);
			this.norishre.pull_from_quiver(arrow, params);
		});

		document.addEventListener("idoru:file-opened", (ev) => {
			this.file_path = ev.detail.file_path;
		});
	}

	setup_norishre_handlers() {
		const mistress = this.norishre;
		// @ts-expect-error on_pulled is still not actually available through missNorishre fn
		mistress.quiver.fileViewer.on_pulled = this.on_file_handler_pulled;
		// @ts-expect-error on_pulled is still not actually available through missNorishre fn
		mistress.quiver.fileEditor.on_pulled = this.on_file_handler_pulled;
	}

	private on_file_handler_pulled = async ({ model, params }: { model: FileHandlerModel, params: ExtraParams; }) => {
		if (!model) {
			const arrow_id = this.norishre.find_arrow_id_by_url()[0] as KeyOf<typeof this.norishre.models>;
			if (this.norishre.is_model_loading(arrow_id)) {
				await this.norishre.loadDrawnArrow();
			}
			// @ts-expect-error
			model = this.norishre.models[arrow_id];
			console.log(arrow_id, model);
		}
		// const model_name = Object.getPrototypeOf(model).constructor.name;

		if (!params) {
			if (this.file_path.length > 0 && model.file_path != this.file_path) {
				const fpath = this.file_path;
				const fname = this.file_path.substring(Math.max(fpath.lastIndexOf("\\"), fpath.lastIndexOf("/")));
				console.log("Opening file based on global file path");
				model.open_file(fname, fpath);
				return;
			}
			model.update_contents();
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
	};

	get is_mounted() {
		return this.view != null && this.view_is_attached;
	}

	get template() {
		return App.template;
	}
	static readonly template = `<idoru-app class="block h-[100vh]">
	<\${ navbar === }/>
	<\${ norishre === }/>
</idoru-app>`;
}

const app = new App();
app.init();

export {
	app
};
