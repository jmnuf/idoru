import { api } from "../tauri-api";
import { os } from "@tauri-apps/api";

class FileEditorPage {
	declare private element: HTMLDivElement;
	file_name: string = "\\0";
	file_path: string = "";
	private checking_file: boolean = false;
	private could_open_file: boolean = false;
	private contents: string[] = [];

	constructor() {
		document.addEventListener("keypress", async ev => {
			if (!this.could_open_file || this.file_path.length < 1 || this.checking_file) {
				return;
			}
			if (!ev.ctrlKey || ev.altKey) {
				return;
			}
			if (ev.code !== "KeyS") {
				return;
			}
			const saved = await api.write_to_file(this.file_path, this.displayed_contents);
			console.error(`TODO: Tell user that we ${saved ? "succesfully saved" : "failed to save"} file`);
		});
	}

	async update_contents() {
		if (!this.could_open_file) return;
		const contents = await api.read_text_file(this.file_path);
		if (!contents) {
			console.error("TODO: Tell user that we failed to reload file contents");
			return;
		}
		this.contents = contents;
	}

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

	get loaded_file() {
		return !this.checking_file && this.could_open_file && this.file_path.length > 0;
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
	static readonly template = `<div class="w-full h-full" \${ ==> element }>
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
