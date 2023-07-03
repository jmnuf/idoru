import type { Norishre } from "@jmnuf/norishre";

class Navbar<T extends Norishre<any>> {
	router: T;
	active_page_css_class: string;
	private _pages: { template: string; target: string; element: HTMLAnchorElement; }[];

	constructor(router: T) {
		this.router = router;
		this.active_page_css_class = "active";
		this._pages = [];
	}

	add_page(arrow_id: `${Exclude<keyof typeof this.router.quiver, symbol>}`, message: string) {
		this._pages.push(this.router.get_arrow(arrow_id, message));
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
