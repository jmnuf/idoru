import type { Norishre } from "@jmnuf/norishre";

class Navbar {
	router: Norishre<any>;

	constructor(router: Norishre<any>) {
		this.router = router;
	}

	get home_link() {
		const arrow = this.router.get_arrow("index", "Home");
		if (window.location.pathname == this.router.arrow_path("index")) {
			arrow.element?.classList.add("disabled");
		} else {
			arrow.element?.classList.remove("disabled");
		}
		return arrow;
	}

	get template() {
		return Navbar.template;
	}
	static readonly template = `
	<nav>
	<\${ home_link === }>
	</nav>
	`;
}

export default function (router: Norishre<any>) {
	return new Navbar(router);
}
