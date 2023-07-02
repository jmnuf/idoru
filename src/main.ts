import { missNorishre } from "@jmnuf/norishre";
import { UI } from "@peasy-lib/peasy-ui";
import Navbar from "./components/navbar";
import { PageModel as IndexModel } from "./pages/index";

const norishre = missNorishre({
	index: {
		path: "/",
		model: async () => IndexModel(norishre)
	}
});
const navbar = Navbar(norishre);

(async function start() {
	UI.create(document.body, navbar, navbar.template);

	await norishre.pull_from_quiver("index");
	UI.create(document.body, norishre, norishre.template);
})()

