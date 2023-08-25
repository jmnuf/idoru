import { KeyOf } from "@jmnuf/norishre/dist/base-types";

export type FormInputType =
	| "date"
	| "datetime-local"
	| "email"
	| "file"
	| "hidden"
	| "image"
	| "month"
	| "number"
	| "password"
	| "radio"
	| "checkbox"
	| "range"
	| "submit"
	| "text"
	| "time"
	;
type FormInputValue = string | number | boolean;
type FormInputValueOfType<T extends FormInputType> = T extends "radio" | "checkbox"
	? boolean
	: T extends "number"
	? number
	: string;
export type FormInputInitData = {
	name: string;
	type: FormInputType;
	value: FormInputValue;
	attributes: Record<string, FormInputValue>;
};

type FormSubmitCallback<T extends FormInputInitData> = (event: SubmitEvent, model: FormModel<T>) => any;

type AttributesObject = {
	[key: string]: FormInputValue;
};

export class InputModel<TType extends FormInputType, TAttr extends AttributesObject> {
	declare private _element: HTMLInputElement;
	declare _value: FormInputValue;
	private _name: string;
	private _type: TType;
	private _attributes: FormInputInitData["attributes"];

	constructor(name: string, type: TType, attrs: TAttr, value?: FormInputValue) {
		this._name = name;
		this._type = type;
		this._attributes = attrs;
		value != null && (this._value = value);
	}

	set_attribute(key: KeyOf<TAttr> | string & {}, value: string | number) {
		this._attributes[key] = value;
	}

	get_attribute(key: KeyOf<TAttr> | string & {}) {
		return this._attributes[key];
	}

	get element() {
		return this._element;
	}
	set element(elem: HTMLInputElement) {
		this._element = elem;
		if (!elem) {
			return;
		}
		for (const key of Object.keys(this._attributes)) {
			const value = this._attributes[key];
			elem.setAttribute(key, `${value}`);
		}
	}
	get name() {
		return this._name;
	}
	get type() {
		return this._type;
	}
	get check_attributes() {
		const elem = this._element;
		if (!elem) return true;
		const known_attrs = Object.keys(this._attributes).concat(["type", "name", "class"]);
		for (const attr of elem.getAttributeNames()) {
			if (known_attrs.includes(attr)) {
				continue;
			}
		}
		for (const key of known_attrs) {
			if (key == "type" || key == "name" || key == "class") {
				continue;
			}
			const value = this._attributes[key];
			elem.setAttribute(key, `${value}`);
		}
		return true;
	}

	get value(): FormInputValueOfType<TType> {
		if (this._type == "radio" || this._type == "checkbox") {
			return (this._element ? this._element.checked : false) as any;
		}
		if (this._type == "number") {
			return (this._element ? this._element.valueAsNumber : NaN) as any;
		}
		return (this._element ? this._element.value : "") as any;
	}

	get template() {
		return InputModel.template;
	}
	static readonly template = `<label>
		\${ name }
		<input class="mb-2" \${ ==> element } \${ name <== name } \${ type <== type } \${ value <=> _value }/>
	</label>`;
}

export function formInput<TType extends FormInputType, TAttr extends AttributesObject>(name: string, type: TType, attr: TAttr) {
	return new InputModel<TType, TAttr>(name, type, attr);
}

type InputFromInitData<T extends FormInputInitData> = InputModel<T["type"], T["attributes"]>;

class FormModel<T extends FormInputInitData> {
	inputs: InputFromInitData<T>[];
	declare private _on_submit: FormSubmitCallback<T>;
	constructor(inputs: T[], submit_callback: FormSubmitCallback<T>) {
		this.inputs = inputs.map(data => {
			return new InputModel<typeof data["type"], typeof data["attributes"]>(data.name, data.type, data.attributes);
		});
		this._on_submit = (event: SubmitEvent, model: FormModel<T>) => {
			submit_callback(event, model);
		};
	}
	static readonly template = `<form \${ submit @=> _on_submit }>
	</form>`;
}

export type Form<T extends FormInputInitData> = FormModel<T>;
export type FormConfig<T extends FormInputInitData> = {
	inputs: T[],
	on_submit: FormSubmitCallback<T>;
};

export default function create_form<const T extends FormInputInitData>(cfg: FormConfig<T>) {
	return new FormModel(cfg.inputs, cfg.on_submit);
}

type InputConfig<T extends AttributesObject> = {
	name: string;
	type: FormInputType;
	value?: FormInputValue;
	attrs: T;
};
export function Input<const T extends AttributesObject>(cfg: InputConfig<T>) {
	return new InputModel(cfg.name, cfg.type, cfg.attrs, cfg.value);
}
