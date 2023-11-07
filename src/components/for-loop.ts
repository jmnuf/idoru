import { PeasyUIModel } from "@jmnuf/norishre";

export type ForConfigObject<TInput> =
	TInput extends PeasyUIModel ? {
		items: TInput[];
		tagName?: string;
		class?: string;
		map?: (item: TInput, index: number) => PeasyUIModel;
	} : {
		items: TInput[];
		map: (item: TInput, index: number) => PeasyUIModel;
		tagName?: string;
		class?: string;
	}
	;

export function For<TInput>(cfg: ForConfigObject<TInput>) {
	const models = cfg.items.reduce((prev, val, idx) => {
		const fn = cfg.map;
		if (!fn) {
			prev[`i${idx}`] = val;
			return prev;
		}
		prev[`i${idx}`] = fn(val, idx);
		return prev;
	}, Object.create(null) as Record<`i${number}`, PeasyUIModel>);
	const wrapperTag = cfg.tagName ?? "for-loop";
	let template = `<${wrapperTag}${cfg.class ? ` class="${cfg.class}"` : ""}>\n`;
	for (const key of Object.keys(models) as `i${number}`[]) {
		template += `<\${ items.${key} === }/>\n`;
	}
	template += `</${wrapperTag}>`;
	return {
		items: models,
		template,
	};
}
