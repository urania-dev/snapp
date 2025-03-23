import type { TranslationsStoreType } from '$lib/i18n/index.svelte';

export { default as CreateSnappForm } from './createSnappForm.svelte';
export { default as EditSnappForm } from './editSnappForm.svelte';
export { default as ExistsSecretField } from './existsSecretField.svelte';
export { default as ExpirationField } from './expirationField.svelte';
export { default as GroupSelector } from './groupSelector.svelte';
export { default as MaxUsages } from './maxUsages.svelte';
export { default as SecretField } from './secretField.svelte';
export { default as SingleForm } from './singleForm.svelte';
export { default as TagSelector } from './tagSelector.svelte';
export { default as UTMParams } from './utmParams.svelte';

export const timeUnits = (i18n: TranslationsStoreType) => [
	{
		id: 'seconds',
		value: i18n.t('snapps.time.seconds')
	},
	{
		id: 'minutes',
		value: i18n.t('snapps.time.minutes')
	},
	{
		id: 'hours',
		value: i18n.t('snapps.time.hours')
	},
	{
		id: 'days',
		value: i18n.t('snapps.time.days')
	},
	{
		id: 'weeks',
		value: i18n.t('snapps.time.weeks')
	},
	{
		id: 'months',
		value: i18n.t('snapps.time.months')
	},
	{
		id: 'years',
		value: i18n.t('snapps.time.years')
	}
];

export const getExpiration = (time: number, units = 'seconds') => {
	let exp = 0;
	switch (units) {
		case 'days':
			exp = time * 60 * 60 * 24;
			break;
		case 'hours':
			exp = time * 60 * 60;
			break;
		case 'minutes':
			exp = time * 60;
			break;
		case 'months':
			exp = time * 60 * 60 * 24 * 7 * 4;
			break;
		case 'weeks':
			exp = time * 60 * 60 * 24 * 7;
			break;
		case 'years':
			exp = time * 60 * 60 * 24 * 365;
			break;
		case 'seconds':
		default:
			exp = time;
			break;
	}
	return exp;
};
