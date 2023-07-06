import { invoke } from "@tauri-apps/api/tauri";

class IndexPage {
	greeting_name: string;
	message: string;

	constructor() {
		this.greeting_name = "";
		this.message = "";
	}

	on_submit = async (event: SubmitEvent, model: IndexPage) => {
		event.preventDefault();
		model.message = await invoke("greet", {
			name: model.greeting_name,
		});
	};

	get template() {
		return IndexPage.template;
	}
	static readonly template = `<div class="flex flex-col container mx-auto mt-2">
		<h1>Welcome to Idoru!</h1>
		
		<div class="flex justify-center mb-4">
			<a href="https://vitejs.dev" target="_blank">
				<img src="/src/assets/vite.svg" class="logo vite" alt="Vite logo" />
			</a>
			<a href="https://tauri.app" target="_blank">
				<img
					src="/src/assets/tauri.svg"
					class="logo tauri"
					alt="Tauri logo"
				/>
			</a>
			<a href="https://www.typescriptlang.org/docs" target="_blank">
				<img
					src="/src/assets/typescript.svg"
					class="logo"
					alt="typescript logo"
				/>
			</a>
		</div>
		
		<form class="row mb-2" id="greet-form" \${ submit @=> on_submit }>
			<input id="greet-input" placeholder="Enter a name..." \${ value <=> greeting_name } />
			<button type="submit" >Greet</button>
		</form>
		<p \${ === message }>\${ message }</p>
	</div>`;
}

export function PageModel() {
	return new IndexPage();
}
