import { missNorishre } from "@jmnuf/norishre";
import { UI } from "@peasy-lib/peasy-ui";
import create_navbar from "./components/navbar";
import { invoke } from "@tauri-apps/api/tauri";

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
	testPage: {
		path: "/testing",
		async model() {
			const { PageModel } = await import("./pages/test");
			const model = PageModel();
			return model;
		},
	}
});
const navbar = create_navbar(norishre);
navbar.add_page("index", "Home");
navbar.add_page("peekFolder", "Peeker");
navbar.add_page("testPage", "debug");
UI.create(document.body, navbar, navbar.template);

const [active_id, params] = norishre.find_arrow_id_by_url();

console.log("Found arrow data:", { active_id, params });

norishre.pull_from_quiver(active_id as any, params).then(() => {
	if (!norishre.pulled_arrow) {
		setTimeout(load_page, 100);
	} else {
		load_page();
	}
});

async function load_page() {
	UI.create(document.body, norishre, norishre.template);
	console.log("Loaded model for arrow with id", active_id);
}
