import { api } from "../tauri-api";
import { os } from "@tauri-apps/api";

class FileEditorPage {
	file_name: string = "\\0";
	file_path: string = "";
	private checking_file: boolean = false;
	private could_open_file: boolean = false;
	private contents: string[] = [];

	async open_file(file_name: string, file_path: string) {
		this.file_name = file_name;
		this.file_path = file_path;
		this.checking_file = true;
		if (!await api.is_openable_as_text(this.file_path)) {
			this.checking_file = false;
			this.could_open_file = false;
			return;
		}
		this.could_open_file = true;
		const contents = await api.read_text_file(this.file_path);
		if (contents == null) {
			this.checking_file = false;
			this.could_open_file = false;
			return;
		}
		this.contents = contents;
		this.checking_file = false;
		this.could_open_file = true;
	}

	get displayed_contents() {
		return this.contents.join(os.EOL);
	}

	set displayed_contents(value: string) {
		this.contents = value.split(os.EOL);
	}

	get template() {
		return FileEditorPage.template;
	}
	static readonly template = `<div class="w-full h-full">
		<h1>\${ file_name }</h1>
		<section class="w-[95%] h-[95%] overflow-y-auto px-6 my-2">
			<pre
				class="mx-0 mt-0 mb-1 [tab-size:2] break-words whitespace-pre-wrap outline-none outline-0"
				contenteditable=true
				\${ innerText <=> displayed_contents }
				\${ === could_open_file }
			></pre>
		</section>
	</div>`;
}

export function PageModel() {
	return new FileEditorPage();
}
