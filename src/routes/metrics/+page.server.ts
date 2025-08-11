import { redirect } from '@sveltejs/kit';

export const load = ({ locals: { user } }) => {
	if (!user) redirect(302, '/');
	return { user };
};
