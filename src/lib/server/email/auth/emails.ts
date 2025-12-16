import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { m } from '$lib/paraglide/messages';
import { settings } from '$lib/server/settings';
import { render } from 'svelte/server';

import { getSMTP } from '..';
import OrganizationInviteEmail from './invite-organization.svelte';
import OtpEmail from './otp.svelte';
import ResetPasswordEmail from './reset-password.svelte';
import VerificationEmail from './verification.svelte';

export const sendVerificationMail = async ({
	url,
	user
}: {
	token: string;
	url: string;
	user: Partial<User>;
}) => {
	const smtp = await getSMTP();
	const config = settings.get();
	const { getClientAddress, request, url: requestUrl } = getRequestEvent();
	let origin = requestUrl.origin;
	if (dev) origin = origin.replace('http:', 'https:');
	const linkToVerification = new URL(`/api/auth${url}`, origin).href;
	const ip =
		getClientAddress() ||
		request.headers.get('x-forwarded-for')?.toString() ||
		'- unable to retrieve ip -';
	const rendered = render(VerificationEmail, {
		props: {
			appname: config.appname,
			ip,
			name: user.username!,
			origin,
			url: linkToVerification
		}
	});

	const email = `<!doctype html><html><head></head><body style="background: #333">${rendered.body}</body>`;
	const textVersion = m.mail_text_verify_email({ linkToVerification, username: user.username! });
	let success = true;
	try {
		if (!smtp) {
			success = false;
		} else {
			await smtp?.sendMail({
				from: config.smtp.from,
				html: email,
				subject: m.auth_verify_email(),
				to: user.email
			});
		}
	} catch {
		success = false;
	}
	if (!success || !smtp) {
		console.log('[smtp off] \n [Loggin email to logs] \r\n %s', textVersion);
	}
};

export const sendResetPasswordMail = async ({
	url,
	user
}: {
	token: string;
	url: string;
	user: Partial<User>;
}) => {
	const smtp = await getSMTP();
	const config = settings.get();
	const { getClientAddress, request, url: requestUrl } = getRequestEvent();
	let origin = requestUrl.origin;
	if (dev) origin = origin.replace('http:', 'https:');
	const ip =
		getClientAddress() ||
		request.headers.get('x-forwarded-for')?.toString() ||
		'- unable to retrieve ip -';
	const rendered = render(ResetPasswordEmail, {
		props: {
			appname: config.appname,
			ip,
			name: user.username!,
			origin,
			url
		}
	});
	const email = `<!doctype html><html><head></head><body style="background: #333">${rendered.body}</body>`;
	const textVersion = m.mail_text_reset_password({
		linkToReset:url,
		username: user.username!
	});
	let success = true;
	try {
		if (!smtp) {
			success = false;
		} else {
			await smtp.sendMail({
				from: config.smtp.from,
				html: email,
				subject: m.auth_reset_password(),
				to: user.email
			});
		}
	} catch {
		success = false;
	}
	if (!success || !smtp) {
		console.log('[smtp off] \n [Logging email to logs] \r\n %s', textVersion);
	}
};
export const sendOtpMail = async ({ otp, user }: { otp: string; user: Partial<User> }) => {
	const smtp = await getSMTP();
	const config = settings.get();
	const { getClientAddress, request, url: requestUrl } = getRequestEvent();
	let origin = requestUrl.origin;
	if (dev) origin = origin.replace('http:', 'https:');
	const ip =
		getClientAddress() ||
		request.headers.get('x-forwarded-for')?.toString() ||
		'- unable to retrieve ip -';
	const rendered = render(OtpEmail, {
		props: {
			appname: config.appname,
			ip,
			name: user.username!,
			origin,
			otp
		}
	});
	const email = `<!doctype html><html><body style="background:#333">${rendered.body}</body></html>`;
	const textVersion = `${m.auth_hello({ name: user.username! })}
${m.auth_verification_code?.({ code: otp }) ?? `Your verification code: ${otp}`}
${m.email_ignore()}
`;
	let success = true;
	try {
		if (!smtp) success = false;
		else
			await smtp.sendMail({
				from: config.smtp.from,
				html: email,
				subject: m.auth_verify_email(),
				to: user.email
			});
	} catch {
		success = false;
	}
	if (!success) {
		console.log('[smtp off] [logging email]\n', textVersion);
	}
};
export const sendInvitationEmail = async ({
	invite
}: {
	invite: {
		email: string;
		id: string;
		invitation: {
			email: string;
			expiresAt: Date;
			id: string;
			inviterId: string;
			organizationId: string;
			role: string;
			status: 'accepted' | 'canceled' | 'pending' | 'rejected';
			teamId?: null | string;
		};
		inviter: {
			createdAt: Date;
			id: string;
			organizationId: string;
			role: string;
			user: {
				createdAt: Date;
				email: string;
				emailVerified: boolean;
				id: string;
				image?: null | string;
				name: string;
				updatedAt: Date;
			};
			userId: string;
		};
		organization: {
			createdAt: Date;
			id: string;
			logo?: null | string;
			metadata?: unknown;
			name: string;
			slug: string;
		};
		role: string;
	};
}) => {
	const smtp = await getSMTP();
	const config = settings.get();
	const { getClientAddress, request, url: requestUrl } = getRequestEvent();

	let origin = requestUrl.origin;
	if (dev) origin = origin.replace('http:', 'https:');

	const acceptLink = new URL(`/auth/invitation/${invite.invitation.id}`, origin).href;

	const ip =
		getClientAddress() ||
		request.headers.get('x-forwarded-for')?.toString() ||
		'- unable to retrieve ip -';

	const rendered = render(OrganizationInviteEmail, {
		props: {
			appname: config.appname,
			expiresAt: invite.invitation.expiresAt,
			inviterName: invite.inviter.user.name,
			ip,
			name: invite.email,
			orgName: invite.organization.name,
			origin,
			role: invite.role,
			url: acceptLink
		}
	});

	const emailHtml = `<!doctype html><html><body style="background:#333">${rendered.body}</body></html>`;

	const text = m.mail_text_org_invite({
		inviter: invite.inviter.user.name,
		link: acceptLink,
		orgName: invite.organization.name,
		role: invite.role,
		username: invite.email
	});

	let success = true;

	try {
		if (!smtp) success = false;
		else {
			await smtp.sendMail({
				from: config.smtp.from,
				html: emailHtml,
				subject: m.mail_subject_org_invite({
					orgName: invite.organization.name
				}),
				text,
				to: invite.email
			});
		}
	} catch {
		success = false;
	}

	if (!success) {
		console.log('[smtp off] [logging email]\n', text);
	}
};
import AdminUserInviteEmail from './admin-user-invite.svelte'; 

export const sendInvitationToUser = async ({
	email,
	url
}: {
	email: string;
	token: string;
	url: string;
}) => {
	const smtp = await getSMTP();
	const config = settings.get();
	const { getClientAddress, request, url: requestUrl } = getRequestEvent();

	let origin = requestUrl.origin;
	if (dev) origin = origin.replace('http:', 'https:');


	const ip =
		getClientAddress() ||
		request.headers.get('x-forwarded-for')?.toString() ||
		'- unable to retrieve ip -';

	const rendered = render(AdminUserInviteEmail, {
		props: {
			appname: config.appname,
			email,
			ip,
			origin,
			url
		}
	});

	const htmlEmail = `<!doctype html><html><body style="background:#333">${rendered.body}</body></html>`;

	const textVersion = m.mail_text_admin_user_invite({
		email,
		link: url
	});

	let success = true;

	try {
		if (!smtp) success = false;
		else {
			await smtp.sendMail({
				from: config.smtp.from,
				html: htmlEmail,
				subject: m.mail_subject_admin_user_invite() as string,
				text: textVersion,
				to: email
			});
		}
	} catch {
		success = false;
	}

	if (!success || !smtp) {
		console.log('[smtp off] [logging email]\n', textVersion);
	}
};
