import { api } from "../tauri-api";
import { os } from "@tauri-apps/api";
import { register, unregister } from '@tauri-apps/api/globalShortcut';

const SaveShortcut = "CmdOrControl+S"

class FileEditorPage {
	declare private element: HTMLDivElement;
	file_name: string = "\\0";
	file_path: string = "";
	private checking_file: boolean = false;
	private could_open_file: boolean = false;
	private contents: string[] = [];
	private true_contents: string[] = [];

	constructor() {
		unregister(SaveShortcut);
	}

	async update_contents() {
		if (this.could_open_file) {
			const contents = await api.read_text_file(this.file_path);
			if (contents == null) {
				console.error("TODO: Tell user that we failed to reload file contents");
				return;
			}
			this.true_contents = contents;
		}
		if (this.contents.length == 0) {
			return;
		}
		const actual_buffer_content = [];
		const eol = os.EOL;
		for (const line of this.contents) {
			if (line.includes(eol)) {
				actual_buffer_content.push(...line.split(eol));
			} else {
				actual_buffer_content.push(line);
			}
		}
		this.contents = actual_buffer_content;
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
		this.true_contents = contents;
		this.contents = contents;
		this.checking_file = false;
		this.could_open_file = true;
	}

	get loaded_file() {
		return !this.checking_file && this.could_open_file && this.file_path.length > 0;
	}

	get displayed_contents() {
		return this.contents.join("\n");
	}

	set displayed_contents(value: string) {
		this.contents = value.split("\n");
	}

	get contents_differ() {
		if (this.true_contents.length != this.contents.length) {
			return true;
		}
		for (let i = 0; i < this.contents.length; i++) {
			const true_line = this.true_contents[i];
			const buff_line = this.contents[i];
			if (true_line != buff_line) {
				return true;
			}
		}
		return false;
	}

	private on_unmount() {
		unregister(SaveShortcut);
		if (!this.could_open_file || this.file_path.length < 1 || this.checking_file) {
			return;
		}
		api.set_last_file(this.file_name, this.contents, this.file_path);
	}

	private async on_mount() {
		// TODO: Move this and somehow handle when refrshing just in case I'm dumb enough
		await register(SaveShortcut, async () => {
			if (!this.could_open_file || this.file_path.length < 1 || this.checking_file) {
				return;
			}
			const saved = await api.write_to_file(this.file_path, this.contents.join(os.EOL));
			if (saved) {
				this.true_contents = [...this.contents];
			} else {
				// TODO: Open dialog box that says that we failed to save for an unknown reason
			}
		});

		const last_file = await api.get_last_file();
		if (this.file_name != "\\0") {
			if (!(last_file && last_file.file_name == this.file_name && this.file_path == last_file.file_path)) {
				return;
			}
		}
		if (!last_file) {
			return;
		}
		//
		this.file_name = last_file.file_name;
		this.file_path = last_file.file_path;
		this.contents = last_file.file_contents;
		const contents = await api.read_text_file(this.file_path);
		if (!contents) {
			this.true_contents = [];
		} else {
			this.true_contents = contents;
		}
		this.checking_file = false;
		this.could_open_file = true;
	}

	// @ts-ignore
	private set pui_view(view: { attached: Promise<any>, detached: Promise<any> }) {
		view.attached.then(() => this.on_mount());
		view.detached.then(() => this.on_unmount());
	}

	get template() {
		return FileEditorPage.template;
	}
	static readonly template = `<div class="w-full h-full" \${ ==> element:pui_view }>
		<h1 \${ !== contents_differ }>\${ file_name }</h1>
		<h1 \${ === contents_differ }><i>\${ file_name }</i></h1>
		<section class="flex w-[95%] h-[95%] overflow-y-auto px-1 my-2 border">
			<pre
				class="mx-0 mt-0 mb-0 [tab-size:2] break-words whitespace-pre-wrap min-w-[90%] outline-none outline-0"
				contenteditable="true"
				\${ innerText <=> displayed_contents }
			></pre>
		</section>
	</div>`;
}

export function PageModel() {
	return new FileEditorPage();
}
