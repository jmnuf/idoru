import bookGif from "../assets/Book.gif";
import { api } from "../tauri-api";

abstract class Renderer {
	file_name: string = "\\0";
	protected _loading: boolean = false;
	abstract readonly is_loading: boolean;
	abstract readonly loading_text: string;
	abstract parse_contents(contents: string[]): Promise<any>;
	abstract template: string;
	static async can_render_file(_file_name: string): Promise<boolean> {
		return true;
	}
}

class PlainTextRenderer extends Renderer {
	declare private file_lines: string[];
	async parse_contents(contents: string[]): Promise<void> {
		this._loading = true;
		this.file_lines = contents;
		this._loading = false;
	}

	get loading_text() {
		if (this.file_name == "<Null File Pointer>" || this.file_name == "\\0") {
			return "Error: NullPointerException";
		}

		return `Loading file: ${this.file_name}...`;
	}

	get is_loading() {
		return this._loading;
	}

	get template() {
		return PlainTextRenderer.template;
	}
	static readonly template = `<div class="flex flex-col w-full">
		<pre class="mx-0 mt-0 mb-1 [tab-size:2] break-words whitespace-pre-wrap" \${ line <=* file_lines }>\${ line }</pre>
	</div>`;
}

class FailedToOpen extends Renderer {
	declare loading_text: string;
	is_loading: boolean = false;
	parse_contents(_: string[]): Promise<any> {
		throw new Error("Method not implemented.");
	}

	get template() {
		return FailedToOpen.template;
	}

	static template = `<div>
		<h1>Failed to load file \${ file_name }</h1>
	</div>`;
}

const NULL_FILE = "<Null File Pointer>";

class FileViewPage {
	private file_name: string;
	private file_path: string;
	private checking_file: boolean;
	declare private contents_renderer: Renderer;

	constructor() {
		this.file_name = NULL_FILE;
		this.file_path = "";
		this.checking_file = true;
	}

	async update_contents() {
		if (!this.could_open_file) return;
		const contents = await api.read_text_file(this.file_path);
		if (contents == null) {
			console.error("TODO: Tell user that we failed to reload file contents");
			return;
		}
		await this.contents_renderer.parse_contents(contents);
	}

	async open_file(file_name: string, file_path: string, update_last_file:boolean = true) {
		this.file_name = file_name;
		this.file_path = file_path;
		this.checking_file = true;
		if (!await api.is_openable_as_text(this.file_path)) {
			this.checking_file = false;
			this.contents_renderer = new FailedToOpen();
			return;
		}
		let renderer: Renderer | null = null;
		for (let i = FileViewPage.renderers.length - 1; i >= 0; i--) {
			const FileRenderer = FileViewPage.renderers[i];
			if (!await FileRenderer.can_render_file(this.file_name)) {
				continue;
			}
			renderer = new FileRenderer();
		}
		renderer = renderer ? renderer : new PlainTextRenderer();
		renderer.file_name = this.file_name;
		const contents = await api.read_text_file(this.file_path);
		if (contents == null) {
			this.checking_file = false;
			this.contents_renderer = new FailedToOpen();
			return;
		}
		if (update_last_file) {
			void api.set_last_file(this.file_name, contents, file_path);
		}
		void renderer.parse_contents(contents);
		this.checking_file = false;
		this.contents_renderer = renderer;
	}

	get is_loading() {
		return this.checking_file || this.contents_renderer?.is_loading;
	}

	get could_open_file() {
		return !this.checking_file && this.contents_renderer && !(this.contents_renderer instanceof FailedToOpen);
	}

	get loading_text() {
		if (this.contents_renderer && this.contents_renderer.loading_text) {
			return this.contents_renderer.loading_text;
		}
		return `Loading: ${this.file_name}`;
	}

	private async on_mount() {
		if (this.file_name != NULL_FILE) {
			return;
		}
		// Fetch global file
		const last_file = await api.get_last_file();
		if (!last_file) {
			return;
		}
		await this.open_file(last_file.file_name, last_file.file_path, false);
	}

	private on_unmount() {}

	// @ts-ignore
	private set pui_view(view: { attached: Promise<any>, detached: Promise<any> }) {
		view.attached.then(() => this.on_mount());
		view.detached.then(() => this.on_unmount());
	}

	get template() {
		return FileViewPage.template;
	}
	static readonly template = `<div class="w-full h-full" \${ ==> element:pui_view }>
		<h1>\${ file_name }</h2>
		<div contenteditable="false" class="w-[95%] h-[95%] overflow-y-auto px-6 my-2" \${ !== is_loading }>
			<article \${ !== is_loading }>
				<\${ contents_renderer === }/>
			</article>
		</div>
		<div class="flex flex-col gap-4 w-full h-full justify-center items-center align-middle text-center" \${ === is_loading }>
			<div class="flex flex-col justify-center items-center text-center">
				<img alt="Book with pages flipping" width="64" height="64" src="${bookGif}">
				<h1 class="text-2xl">\${ loading_text }</h1>
			</div>
		</div>
	</div>`;
	static renderers: ({ new(): Renderer, can_render_file(file_name: string): Promise<boolean>; })[] = [PlainTextRenderer];
}

export function PageModel() {
	return new FileViewPage();
}

export type FileViewModel = FileViewPage;
