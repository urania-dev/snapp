import type { Snapp } from '@prisma/client';

import { error, redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { singleSchema } from '$lib/components/snapps/schema';
import { prisma } from '$lib/db/prisma';
import { log } from '$lib/server/log';
import { markUsage } from '$lib/server/snapps/markUsage';
import { logSecretInvalidOnSnapp, logSnappNotFound } from '$lib/umami';
import bcrypt from 'bcryptjs';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const {
		locals: { user },
		params: { groupId, shortcode }
	} = event;


	const snapp = await prisma.$transaction(async (p) => {
		await p.snapp.updateMany({ data: { disabled: true }, where: { expiresAt: { lte: new Date() } } })
		return await p.snapp.findFirst({ where: { groupId, shortcode } })
	})


	if (!snapp) {
		logSnappNotFound(event)
		throw error(404, { message: 'errors.snapps.not-found' });
	}
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
			params: { shortcode }
		} = event;
		const secretForm = await superValidate(event, zod(singleSchema));

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
			return { form: secretForm, message: "errors.generic" }
		}
		if (!snapp) {
			logSnappNotFound(event)
			return fail(400, { form: secretForm, message: 'errors.snapps.not-found', });}

		const isPasswordCorrect = await bcrypt.compare(secretForm.data.secret, snapp.secret!)

		if (!isPasswordCorrect) {
			logSecretInvalidOnSnapp(event)
			return fail(400, { form: secretForm, message: "errors.auth.wrong-credentials" })
		}
		const [available, err] = await markUsage(event, snapp);

		const url = new URL(snapp.originalUrl);

		const utmParamsString = JSON.parse(snapp.utmParams || '[]') as string[];
		const utmParams = utmParamsString.map((p) => {
			const [key, value, name] = JSON.parse(p) as string[];
			return { key, name, value };
		});

		for (const params of utmParams) {
			url.searchParams.set(params.key, params.value);
		}

		if (available) redirect(302, url);
		else {
			return {
				err,
				hasPassword: false,
				isDisabled: true,
				message: undefined
			};
		}

	}
};


