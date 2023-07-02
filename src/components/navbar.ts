import type { Norishre } from "@jmnuf/norishre";

class Navbar {
	router: Norishre<any>;
	private _pages: { template: string; target: string; element: HTMLAnchorElement; }[];

	constructor(router: Norishre<any>) {
		this.router = router;
		this._pages = [];
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

	get pages() {
		for (const arrow of this._pages) {
			if (window.location.pathname == this.router.arrow_path(arrow.target)) {
				arrow.element?.classList.add("disabled");
			} else {
				arrow.element?.classList.remove("disabled");
			}
		}
		return this._pages;
	}

	get template() {
		return Navbar.template;
	}
	static readonly template = `
	<nav>
	<ul>
		<li pui="page_link <=* pages"><\${ page_link === }> </li>
	</ul>
	</nav>
	`;
}

export default function (router: Norishre<any>) {
	return new Navbar(router);
}
