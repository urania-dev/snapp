import { redirect } from "@sveltejs/kit";
import { env } from "$env/dynamic/public";

export const load = async ({ locals: { prisma, user }, params: { id } }) => {
	if (!user) redirect(302, "/auth/sign-in");

	const snapp = await prisma.snapp.findFirst({
		include: { tag: true },
		where: { id }
	});
	const EXTRA_GROUPS_EDITABLE = /^(1|true|yes)$/i.test(env?.PUBLIC_EXTRA_GROUPS_EDITABLE || "");

	if (!snapp || (snapp?.userId !== user.id && user.role === "user" && !EXTRA_GROUPS_EDITABLE))
		redirect(302, "/dashboard");

	return { snapp };
};
