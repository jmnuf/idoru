import { missNorishre } from "@jmnuf/norishre";
import { UI } from "@peasy-lib/peasy-ui";
import create_navbar from "./components/navbar";
import { PageModel as IndexModel } from "./pages/index";

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
			model.do_search(false);
			return model;
		}
	}
});
const navbar = create_navbar(norishre);
navbar.add_page("index", "Home");
navbar.add_page("peekFolder", "Peeker");
UI.create(document.body, navbar, navbar.template);

norishre.pull_from_quiver("index").then(() => {
	UI.create(document.body, norishre, norishre.template);
});
