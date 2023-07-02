import type { Norishre } from "@jmnuf/norishre";
import { invoke } from "@tauri-apps/api/tauri";

class IndexPage<T extends Norishre<any>> {
	greeting_name: string;
	message: string;
	router: T;

	constructor(router: T) {
		this.router = router;
		this.greeting_name = "";
		this.message = "";
	}

	on_clicked = async (_: unknown, model: IndexPage<T>) => {
		model.message = await invoke("greet", {
			name: model.greeting_name,
		});
	};

	get template() {
		return IndexPage.template;
	}
	static readonly template = `
	<div class="container">
		<h1>Welcome to Idoru!</h1>
		
		<div class="row">
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
					class="logo typescript"
					alt="typescript logo"
				/>
			</a>
		</div>
		
		<form class="row" id="greet-form">
			<input id="greet-input" placeholder="Enter a name..." \${ value <=> greeting_name } />
			<button type="button" \${ click @=> on_clicked } >Greet</button>
		</form>
		<p \${ === message }>\${ message }</p>
	</div>
	`;
}

export function PageModel<T extends Norishre<any>>(router: T) {
	return new IndexPage(router);
}
