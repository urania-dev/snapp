import { init, register } from 'svelte-i18n';

const defaultLocale = 'en';

register('en', () => import('./locales/en-US.json'));
register('it', () => import('./locales/it-IT.json'));
register('es', () => import('./locales/es-ES.json'));
register('gl-ES', () => import('./locales/gl-ES.json'));
register('de', () => import('./locales/de-DE.json'));
register('fr', () => import('./locales/fr-FR.json'));
register('zh-CN', () => import('./locales/zh-CN.json'));

init({
	fallbackLocale: defaultLocale,
	initialLocale: defaultLocale
});
