import { missNorishre } from "@jmnuf/norishre";
import { UI } from "@peasy-lib/peasy-ui";
import Navbar from "./components/navbar";
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
			model.on_submit(null, model);
			return model;
		}
	}
});
const navbar = Navbar(norishre);
navbar.add_page("index", "Home");
navbar.add_page("peekFolder", "Peeker");

(async function start() {
	UI.create(document.body, navbar, navbar.template);

	await norishre.pull_from_quiver("index");
	UI.create(document.body, norishre, norishre.template);
})();

