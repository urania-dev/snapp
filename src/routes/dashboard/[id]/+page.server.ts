import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { prisma, user }, params: { id } }) => {
	if (!user) redirect(302, '/auth/sign-in');

	const snapp = await prisma.snapp.findFirst({
		include: { tag: true },
		where: { id }
	});

	if (!snapp || (snapp?.userId !== user.id && user.role === 'user')) redirect(302, '/dashboard');

	return { snapp };
};
