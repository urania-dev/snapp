import type { Snapp } from '@prisma/client';

import { error, redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { singleSchema } from '$lib/components/snapps/schema';
import { log } from '$lib/server/log';
import { markUsage } from '$lib/server/snapps/markUsage';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const {
		locals: { prisma, user },
		params: { shortcode }
	} = event;

	const snapp = await prisma.snapp.findFirst({ where: { shortcode } });

	if (!snapp) throw error(404, { message: 'errors.snapps.not-found' });
	const url = new URL(snapp.originalUrl);

	const utmParamsString = JSON.parse(snapp.utmParams || '[]') as string[];
	const utmParams = utmParamsString.map((p) => {
		const [key, value, name] = JSON.parse(p) as string[];
		return { key, name, value };
	});

	for (const params of utmParams) {
		url.searchParams.set(params.key, params.value);
	}
	if (snapp.secret === null && snapp.userId !== user?.id) {
		const [available, err] = await markUsage(event, snapp);
		if (available) redirect(302, encodeURI(decodeURI(url.toString())));
		else {
			return {
				err,
				hasPassword: false,
				isDisabled: true
			};
		}
	} else if (snapp.userId === user?.id) {
		redirect(302, encodeURI(decodeURI(url.toString())));
	}

	return {
		form: await superValidate(zod(singleSchema)),
		hasPassword: true,
		isDisabled: false
	};
};

export const actions = {
	trySecret: async (event) => {
		const {
			locals: { prisma },
			params: { shortcode }
		} = event;
		const secretForm = await superValidate(event, zod(singleSchema));
		log.info(secretForm);
		if (!secretForm.valid) {
			return fail(400, {
				form: secretForm
			});
		}
		let snapp: null | Snapp = null;
		try {
			snapp = await prisma.snapp.findFirst({ where: { shortcode } });
		} catch (error) {
			log.error(error);
		}
		if (!snapp) return fail(400, { message: 'errors.snapps.not-found' });
		const [available, err] = await markUsage(event, snapp);
		const finalURL = new URL(encodeURI(decodeURI(snapp.originalUrl.toString())));
		if (available) redirect(302, finalURL);
		else {
			return {
				err,
				hasPassword: false,
				isDisabled: true
			};
		}
	}
};
