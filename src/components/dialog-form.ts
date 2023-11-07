import { PeasyUIModel } from "@jmnuf/norishre";
import { For } from "./for-loop";
import create_form from "./form";
import type { Form, FormConfig, FormInputInitData } from "./form";

type ListenerType = "accepted" | "canceled";
type ListenerCB<T extends ListenerType> = T extends "accepted"
	? (value?: string | undefined) => any
	: () => any
	;
type ListenersObj = {
	[K in ListenerType]?: ListenerCB<K>[];
};

class DialogForm<T extends FormInputInitData> {
	declare element: HTMLDialogElement;
	title?: string;
	message?: string;
	form: Form<T>;

	private _listeners: ListenersObj;

	declare private _on_closed: () => Promise<any>;
	declare forInputs: PeasyUIModel;

	constructor(cfg: FormConfig<T>) {
		this.title = undefined;
		this.message = undefined;
		this._listeners = {};
		this.form = create_form(cfg);
		this.form.inputs;
		// console.log(this.inputs);
		this.forInputs = For({
			items: this.inputs,
			tagName: "div",
			class: "flex flex-col",
		});

		this._on_closed = async () => {
			const val = this.element.returnValue as ListenerType | "" | undefined;
			if (!val || val == "canceled") {
				if (this._listeners.canceled) {
					for (const cb of this._listeners.canceled) {
						await cb();
					}
				}
				return;
			}
			if (!this._listeners.accepted) {
				return;
			}
			for (const cb of this._listeners.accepted) {
				await cb();
			}
		};

		// Object.defineProperties(this, {
		// 	inputs: {
		// 		get(this: PopupForm) {
		// 			return this.form.inputs;
		// 		},
		// 	}
		// });
	}

	open() {
		const elem = this.element;
		if (!elem) return;
		elem.showModal();
	}

	close(accept?: boolean) {
		const elem = this.element;
		if (!elem) return;
		let value: ListenerType = "canceled";
		if (typeof accept == "boolean" && accept) {
			value = "accepted";
		}
		elem.close(value);
	}

	cancel = function (this: DialogForm<T>) {
		const elem = this.element;
		if (!elem || !elem.open) return;
		elem.close();
	}.bind(this);

	on<T extends ListenerType>(event_type: T, callback: ListenerCB<T>) {
		let arr = this._listeners[event_type];
		if (!arr) {
			arr = [];
		}
		arr.push(callback);
		this._listeners[event_type] = arr;
	}

	get inputs() {
		return this.form.inputs;
	}

	set inp(elem: HTMLElement) {
		console.log(elem);
	}

	set logger(x: any) {
		console.log(x);
	}

	get template() {
		return DialogForm.template;
	}
	static readonly template = `<dialog class="modal" \${ close @=> _on_closed } \${ ==> element }>
		<form class="flex flex-col">
			<h2 \${ === title }>\${ title }</h2>
			<p \${ === message }>\${ message }</p>
			<\${ forInputs === }/>
			<div class="row">
				<button \${ click @=> cancel } value="cancel" formmethod="dialog">Cancel</button>
				<button value="accept" formmethod="dialog">Accept</button>
			</div>
		</form>
	</dialog>`;
	// static readonly template = `<dialog class="modal" \${ close @=> _on_closed } \${ ==> element }>
	// 	<form class="flex flex-col">
	// 		<h2 \${ === title }>\${ title }</h2>
	// 		<p \${ === message }>\${ message }</p>
	// 		<div class="flex flex-col">
	// 			<span \${ finp <=* inputs }><\${ finp === }/></span>
	// 		</div>
	// 		<div class="row">
	// 			<button \${ click @=> cancel } value="cancel" formmethod="dialog">Cancel</button>
	// 			<button value="accept" formmethod="dialog">Accept</button>
	// 		</div>
	// 	</form>
	// </dialog>`;
}

export type PopupFormModel<T extends FormInputInitData> = DialogForm<T>;

export default function create_dialogform<T extends FormInputInitData>(cfg: FormConfig<T>) {
	return new DialogForm(cfg);
}
