import type { PageChangeEvent, PAGE_CHANGE_EVENT_NAME } from "../events/page-change-event";
import type { FileOpenedEvent, FILE_OPENED_EVENT_NAME } from "../events/file-opened-event";

interface CustomEventMap {
	[PAGE_CHANGE_EVENT_NAME]: PageChangeEvent;
	[FILE_OPENED_EVENT_NAME]: FileOpenedEvent;
}

declare global {
	interface Document { //adds definition to Document, but you can do the same with HTMLElement
		addEventListener<K extends keyof CustomEventMap>(type: K, listener: (this: Document, ev: CustomEventMap[K]) => void): void;
		dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): void;
	}
}
export { }; //keep that for TS compiler.