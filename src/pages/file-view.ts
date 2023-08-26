
class FileView {
	private file_lines: string[];
	private file_name: string;

	constructor() {
		this.file_lines = [];
		this.file_name = "<New File>";
	}

	use_file(name: string, content: string[]) {
		this.file_name = name;
		this.file_lines = content;
	}

	get template() {
		return FileView.template;
	}
	static readonly template = `<div class="w-full h-full">
		<h1>\${ file_name }</h2>
		<div contenteditable="false" class="w-[95%] h-[95%] overflow-y-auto px-6 my-2">
			<pre class="mx-0 mt-0 mb-1 [tab-size:2]" \${ line <=* file_lines }>\${ line }</pre>
		</div>
	</div>`;
}

export function PageModel() {
	return new FileView();
}

export type FileViewModel = FileView;
