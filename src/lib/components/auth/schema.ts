import { z } from 'zod';

export const signUpSchema = z
	.object({
		confirm_password: z.string().trim().min(8, ''),
		email: z.string().email('errors.auth.email-invalid').nonempty(''),
		password: z
			.string()
			.trim()
			.min(8, '') // Minimum length of 8 characters
			.regex(
				/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d])([^\s])+$/,
				'errors.auth.password-invalid'
			),
		username: z.string().trim().min(3, 'errors.auth.username-invalid')
	})
	.refine((data) => data.password === data.confirm_password, {
		message: 'errors.auth.password-unmatch',
		path: ['confirm_password'] // Point the error to the confirm_password field
	});

export type SignUpSchema = typeof signUpSchema;

export const recoverSchema = z
	.object({
		confirm_password: z.string().trim().min(8, ''),
		password: z
			.string()
			.trim()
			.min(8, '') // Minimum length of 8 characters
			.regex(
				/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d])([^\s])+$/,
				'errors.auth.password-invalid'
			),
		token: z.string()
	})
	.refine((data) => data.password === data.confirm_password, {
		message: 'errors.auth.password-unmatch',
		path: ['confirm_password'] // Point the error to the confirm_password field
	});

export type RecoverPasswordSchema = typeof recoverSchema;

export const signInSchema = z.object({
	password: z.string().trim(),
	username: z.string().trim().min(1, 'errors.auth.username-invalid')
});

export type SignInSchema = typeof signInSchema;

export const forgotSchema = z.object({
	email: z.string().email('errors.auth.email-invalid').nonempty('')
});

export type ForgotSchema = typeof forgotSchema;

export const otpSchema = z.object({
	otp: z.string().length(6)
});

export type OTPSchema = typeof otpSchema;

export const createUserSchema = z.object({
	email: z.string().email('errors.auth.email-invalid').nonempty(''),
	role: z.string().default('user'),
	username: z.string().trim().min(3, 'errors.auth.username-invalid')
});

export type CreateUserSchema = typeof createUserSchema;
