import { missNorishre } from "@jmnuf/norishre";
import { UI } from "@peasy-lib/peasy-ui";
import create_navbar from "./components/navbar";
import { PageModel as IndexModel } from "./pages/index";
import { invoke } from "@tauri-apps/api/tauri";

const norishre = missNorishre({
	index: {
		path: "/",
		model: IndexModel(),
	},
	peekFolder: {
		path: "/peeker",
		model: async () => {
			const { PageModel } = await import("./pages/peek-folder");
			const model = PageModel();
			try {
				const path = await invoke<string>("relative_to_full_path", { relativePath: "./" });
				console.log("Transforming", "'./'", "to", path);
				if (typeof path == "string") {
					model.base_directory = path;
					model.directory = path;
				}
			} catch (err) {
				console.error(err);
			}
			model.do_search(false);
			return model;
		}
	}
});
const navbar = create_navbar(norishre);
navbar.add_page("index", "Home");
navbar.add_page("peekFolder", "Peeker");
UI.create(document.body, navbar, navbar.template);

const [active_id, params] = norishre.find_arrow_id_by_url();

norishre.pull_from_quiver(active_id as any, params).then(() => {
	UI.create(document.body, norishre, norishre.template);
});
