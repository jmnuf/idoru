
export const FILE_OPENED_EVENT_NAME = "idoru:file-opened";

export class FileOpenedEvent extends CustomEvent<{ file_path: string; }> {
	constructor(file_path: string) {
		super(FILE_OPENED_EVENT_NAME, { bubbles: true, cancelable: false, detail: { file_path } });
	}

	static emitNew(path: string, element = document.body) {
		const event = new FileOpenedEvent(path);
		element.dispatchEvent(event);
	}
}
