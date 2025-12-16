import { createHighlighterCore } from 'shiki/core';
// Follows the best practices established in https://shiki.matsu.io/guide/best-performance
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
const bundledLanguages = {
	bash: () => import('@shikijs/langs/bash'),
	diff: () => import('@shikijs/langs/diff'),
	javascript: () => import('@shikijs/langs/javascript'),
	json: () => import('@shikijs/langs/json'),
	svelte: () => import('@shikijs/langs/svelte'),
	typescript: () => import('@shikijs/langs/typescript'),
	yaml: () => import('@shikijs/langs/yaml')
};
/** The languages configured for the highlighter */
export type SupportedLanguage = keyof typeof bundledLanguages;
/** A preloaded highlighter instance. */
export const highlighter = createHighlighterCore({
	engine: createJavaScriptRegexEngine(),
	langs: Object.entries(bundledLanguages).map(([, lang]) => lang),
	themes: [import('@shikijs/themes/nord'), import('@shikijs/themes/min-light')]
});
