import { fail, redirect } from "@sveltejs/kit";
import { forgotSchema } from "$lib/components/auth/schema";
import { prisma } from "$lib/db/prisma";
import { createPasswordResetToken } from "$lib/server/auth/index.js";
import { getSettings } from "$lib/server/config/index.js";
import ForgotPasswordEmail from "$lib/server/emails/auth/forgotPasswordEmail.svelte";
import { sendEmail } from "$lib/server/smtp";
import { watchLists } from "$lib/server/watchlists/index.js";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
export const load = async ({ locals: { user } }) => {
	if (user) redirect(302, "/dashboard");
	return {
		form: await superValidate(zod(forgotSchema))
	};
};

export const actions = {
	"forgot-password": async (event) => {
		const form = await superValidate(event, zod(forgotSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}
		const settings = await getSettings();
		const auth = await prisma.user.findFirst({
			where: { email: form.data.email }
		});

		if (auth) {
			const validEmail = await watchLists.checkEmail(form.data.email);
			const validUsername = await watchLists.checkUsername(auth.username);
			if (!validEmail || !validUsername) {
				return fail(400, { form, message: "errors.auth.blacklisted" });
			}

			const { tokenHash } = await createPasswordResetToken(auth.id);
			const recoveryURL = `${event.url.origin}/auth/recover-password?token=${tokenHash}`;
			const appname = settings.get<string>("appname") || "Snapp";
			const ip = event.request.headers.get("X-FORWARDED-FOR") || "[no ip traceable.]";

			await sendEmail(
				ForgotPasswordEmail,
				{ appname, ip, recoveryURL },
				auth.email,
				appname + " | Requested reset password"
			);
		}

		return {
			form
		};
	}
};
