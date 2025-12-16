import * as v from 'valibot';

export const PreferenceSchema = v.optional(
	v.object({
		lang: v.optional(v.union([v.literal('en')]), 'en'),
		theme: v.optional(
			v.union([v.literal('dark'), v.literal('light'), v.literal('system')]),
			'system'
		)
	}),
	{
		lang: 'en',
		theme: 'system'
	}
);
export const parsePreferences = (payload: unknown) => {
	return v.parse(PreferenceSchema, payload);
};
export type TPreferences = v.InferOutput<typeof PreferenceSchema>;
export type TPreferencesInput = v.InferInput<typeof PreferenceSchema>;
export type TPreferencesOutput = v.InferIssue<typeof PreferenceSchema>;
