import { command, query } from '$app/server';
import { preferences } from '$lib/server/preferences';
import * as v from 'valibot';

import { requireUser } from './auth.remote';
export const getPreferences = query(async () => {
	const user = await requireUser();
	const pref = preferences.get(user.id);
	return pref;
});
export const saveThemePreference = command(
	v.union([v.literal('dark'), v.literal('light'), v.literal('system')]),
	async (theme) => {
		const user = await requireUser();
		const pref = preferences.get(user.id);
		preferences.set({ ...pref, theme }, user.id);
	}
);
export const saveLanguagePreference = command(v.union([v.literal('en')]), async (theme) => {
	const user = await requireUser();
	const pref = preferences.get(user.id);
	preferences.set({ ...pref, theme }, user.id);
});
