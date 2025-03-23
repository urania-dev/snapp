import { z } from 'zod';

export const profileSchema = z.object({
	email: z.string().email('errors.auth.email-invalid').nonempty(''),
	username: z.string().trim().min(3, 'errors.auth.username-invalid')
});

export type ProfileSchema = typeof profileSchema;

export const smtpSchema = z.object({
	from: z.string(),
	host: z.string(),
	pass: z.string(),
	port: z.number({ invalid_type_error: '' }),
	ssl: z.boolean(),
	user: z.string()
});

export type SMTPSchema = typeof smtpSchema;
