import {
	addMessages,
	init,
	getLocaleFromNavigator,
	locale,
	_
} from "svelte-i18n";

const langs = import.meta.glob("./lang/*.json", {
	eager: true
});

type LangsRecord = Record<
	string,
	{
		[key: string]: any;
	}
>;

export function process_langs(): LangsRecord {
	let _langs: LangsRecord = {};

	for (const lang in langs) {
		const code = (lang.split("/").pop() as string).split(".").shift() as string;
		_langs[code] = (langs[lang] as Record<string, any>).default;
	}

	return _langs;
}

const processed_langs = process_langs();
const available_locales = Object.keys(processed_langs);

export const language_choices: [string, string][] = Object.entries(
	processed_langs
).map(([code, data]) => [data._name || code, code]);

export let all_common_keys: Set<string> = new Set();

for (const lang in processed_langs) {
	addMessages(lang, processed_langs[lang]);
}

let i18n_initialized = false;

export async function setupi18n(): Promise<void> {
	if (i18n_initialized) {
		return;
	}

	const browser_locale = getLocaleFromNavigator();

	let initial_locale =
		browser_locale && available_locales.includes(browser_locale)
			? browser_locale
			: null;

	if (!initial_locale) {
		const normalized_locale = browser_locale?.split("-")[0];
		initial_locale =
			normalized_locale && available_locales.includes(normalized_locale)
				? normalized_locale
				: "en";
	}

	await init({
		fallbackLocale: "en",
		initialLocale: initial_locale
	});

	for (const lang_code in processed_langs) {
		if (
			processed_langs[lang_code] &&
			typeof processed_langs[lang_code] === "object" &&
			processed_langs[lang_code].common &&
			typeof processed_langs[lang_code].common === "object"
		) {
			const common_ns = processed_langs[lang_code].common;
			for (const key in common_ns) {
				all_common_keys.add(`common.${key}`);
			}
		}
	}

	i18n_initialized = true;
}

export function changeLocale(new_locale: string): void {
	locale.set(new_locale);
}
