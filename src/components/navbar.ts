import type { Norishre } from "@jmnuf/norishre";
import { Quiver, KeyOf } from "@jmnuf/norishre/dist/base-types";

type PageArrowComponent<TQuiver extends Quiver> = {
	template: string;
	target: KeyOf<TQuiver>;
	element: HTMLAnchorElement;
};

class Navbar<TQuiver extends Quiver> {
	router: Norishre<TQuiver>;
	active_page_css_class: string;
	private _pages: PageArrowComponent<TQuiver>[];

	constructor(router: Norishre<TQuiver>) {
		this.router = router;
		this.active_page_css_class = "active";
		this._pages = [];
	}

	add_page(arrow_id: KeyOf<TQuiver>, message: string) {
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

export default function create<T extends Quiver>(router: Norishre<T>) {
	return new Navbar<T>(router);
}
