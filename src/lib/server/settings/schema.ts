import { m } from '$lib/paraglide/messages';
import { HostSchema } from '$lib/schemas/host.schema';
import * as v from 'valibot';
export const SettingSchema = v.fallback(v.object({
	admin: v.array(
		v.object({
			email: v.pipe(v.string(), v.email(m.errors_email_invalid())),
			username: v.pipe(v.string(), v.minLength(3, m.errors_username_invalid()))
		})
	),
	appname: v.optional(v.string(), 'Snapp'),
	hosts: v.array(HostSchema),
	smtp: v.object({
		enabled: v.boolean(),
		from: v.optional(
			v.pipe(
				v.string(m.errors_non_empty()),
				v.nonEmpty(m.errors_non_empty()),
				v.email(m.errors_email_invalid())
			)
		),
		host: v.optional(v.string()),
		pass: v.optional(v.string()),
		port: v.optional(v.number()),
		secure: v.optional(v.boolean()),
		user: v.optional(v.pipe(v.string(m.errors_non_empty()), v.nonEmpty(m.errors_non_empty())))
	})
}),{
	admin: [{
		email: "admin@example.org",
		username: "admin"
	}],
	appname:'Snapp',
	hosts:[{
		options:{
			customRedirect:'/dashboard',
			disable:{
				homepage:false,
				limits:false,
				lowerCaseFallback:true,
				signup:false,
				twoFactor:true,
			},
		},
		origin: 'http://localhost:3000'
	}],
	smtp:{
		enabled:false,
	}
});
export const parseSettings = (payload: unknown) => {
	return v.parse(SettingSchema, payload);
};
export type TSettings = v.InferOutput<typeof SettingSchema>;
export type TSettingsInput = v.InferInput<typeof SettingSchema>;
export type TSettingsOutput = v.InferIssue<typeof SettingSchema>;
