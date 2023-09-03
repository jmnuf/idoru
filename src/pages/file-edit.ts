
class FileEditorPage {
	file_name: string = "\\0";

	get template() {
		return FileEditorPage.template;
	}
	static readonly template = `<div class="flex flex-col justify-center items-center w-full h-full">
		<h1>\${ file_name }</h1>
		<section class="flex flex-col p-2">
		</section>
	</div>`;
}

export function PageModel() {
	return new FileEditorPage();
}
