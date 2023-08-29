import bookGif from "../assets/Book.gif";

class FileContentsRenderer {
	private _loading: boolean = false;
	private _file_name: string = "\\0";

	set file_name(name: string) {
		this._file_name = name;
		this._loading = true;
		if (name == "<Null File Pointer>") {
			return;
		}
		setTimeout(() => {
			this._loading = false;
		}, 1_500);
	}

	get file_name() {
		return this._file_name;
	}

	get loading_text() {
		if (this._file_name == "<Null File Pointer>") {
			return "Error: NullPointerException";
		}

		return `Loading file: ${this._file_name}...`;
	}

	get is_loading() {
		return this._loading;
	}

	get template() {
		return FileContentsRenderer.template;
	}
	static readonly template = `<div class="flex flex-col">
		<div class="flex flex-col gap-4 w-full justify-center items-center align-middle text-center" \${ === is_loading }>
			<h1 class="text-2xl">\${ loading_text }</h1>
			<img alt="Book with pages flipping" width="64" height="64" src="${bookGif}">
		</div>
		<article \${ !== is_loading }>
		</article>
	</div>`;
}

class FileViewPage {
	private file_lines: string[];
	private file_name: string;
	private contents_renderer: FileContentsRenderer;

	constructor() {
		this.file_lines = [];
		this.file_name = "<Null File Pointer>";
		this.contents_renderer = new FileContentsRenderer();
		this.contents_renderer.file_name = this.file_name;
	}

	use_file(name: string, content: string[]) {
		this.file_name = name;
		this.file_lines = content;
		this.contents_renderer.file_name = name;
	}

	get is_loading() {
		return this.contents_renderer.is_loading;
	}

	get template() {
		return FileViewPage.template;
	}
	static readonly template = `<div class="w-full h-full">
		<h1>\${ file_name }</h2>
		<div contenteditable="false" class="w-[95%] h-[95%] overflow-y-auto px-6 my-2" \${ !== is_loading }>
			<pre class="mx-0 mt-0 mb-1 [tab-size:2] break-words whitespace-pre-wrap" \${ line <=* file_lines }>\${ line }</pre>
		</div>
		<\${ contents_renderer === }/>
	</div>`;
}

export function PageModel() {
	return new FileViewPage();
}

export type FileViewModel = FileViewPage;
