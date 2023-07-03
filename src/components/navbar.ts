import type { Norishre } from "@jmnuf/norishre";

class Navbar {
	router: Norishre<any>;
	active_page_css_class: string;
	private _pages: { template: string; target: string; element: HTMLAnchorElement; }[];

	constructor(router: Norishre<any>) {
		this.router = router;
		this.active_page_css_class = "active";
		this._pages = [];
	}

	get pages() {
		const css_class = this.active_page_css_class;
		for (const arrow of this._pages) {
			if (window.location.pathname == this.router.arrow_path(arrow.target)) {
				arrow.element?.classList.add(css_class);
			} else {
				arrow.element?.classList.remove(css_class);
			}
		}
		return this._pages;
	}

	get template() {
		return Navbar.template;
	}
	static readonly template = `<nav>
		<ul>
			<li pui="page_link <=* pages"><\${ page_link === }> </li>
		</ul>
	</nav>`;
}

export default function (router: Norishre<any>) {
	return new Navbar(router);
}
