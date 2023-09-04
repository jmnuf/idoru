import { ExtraParams, KeyOf } from "@jmnuf/norishre/dist/base-types";
import type { AppRouter } from "../main";

export const PAGE_CHANGE_EVENT_NAME = "idoru:page-change";

export class PageChangeEvent extends CustomEvent<{ arrow: Exclude<KeyOf<AppRouter["quiver"]>, `%${string}%`>; params: ExtraParams | undefined; }> {
	constructor(arrow: Exclude<KeyOf<AppRouter["quiver"]>, `%${string}%`>, params?: ExtraParams | undefined) {
		super(PAGE_CHANGE_EVENT_NAME, { bubbles: true, cancelable: true, detail: { arrow, params } });
	}

	static emitNew(elem: HTMLElement, route: Exclude<KeyOf<AppRouter["quiver"]>, `%${string}%`>, params?: ExtraParams | undefined) {
		const event = new PageChangeEvent(route, params);
		return elem.dispatchEvent(event);
	}
}
