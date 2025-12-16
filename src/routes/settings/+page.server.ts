import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { user }, parent }) => {
	if (user?.role !== 'admin') redirect(307, '/dashboard');
	const data = await parent();
	return { ...data };
};
