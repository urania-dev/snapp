import { init, register } from 'svelte-i18n';

const defaultLocale = 'en';

register('en', () => import('./locales/en.json'));
register('it', () => import('./locales/it.json'));
register('es', () => import('./locales/es.json'));
register('gl', () => import('./locales/gl.json'));
register('de', () => import('./locales/de.json'));
register('fr', () => import('./locales/fr.json'));

init({
	fallbackLocale: defaultLocale,
	initialLocale: defaultLocale
});
