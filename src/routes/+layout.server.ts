import { loadTranslations } from '$lib/i18n/server';
import { getSettings } from '$lib/server/config/index.js';

export const load = async ({ depends, locals: { lang, theme, user }, url }) => {
	depends('i18n');
	const settings = await getSettings();
	const appname = settings.get<string>('APPNAME');
	const disableHome = settings.get<boolean>('DISABLE_HOME') === true;
	const customRedirect = settings.get<string>('CUSTOM_REDIRECT') !== '/dashboard';
	return {
		appname,
		customRedirect,
		disableHome,
		locale: lang,
		role: user?.role || 'user',
		theme,
		translations: await loadTranslations(lang),
		url: url.toString()
	};
};
