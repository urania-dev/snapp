import type { Handle } from '@sveltejs/kit';

import { paraglideMiddleware } from '$lib/paraglide/server';
const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ locale, request }) => {
		event.request = request;
		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});
export default handleParaglide;
