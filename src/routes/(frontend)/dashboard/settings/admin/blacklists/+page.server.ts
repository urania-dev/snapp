import {
	db,
	domainZList,
	emailZList,
	providerZList,
	usernameZList,
	whiteEmailZList,
	whiteProviderZList
} from '$lib/db/index.js';
import { extractDomain } from '$lib/db/snapps/shorten.js';
import { error, fail, redirect } from '@sveltejs/kit';

export async function load({ locals, depends }) {
	depends('snapp:admin:settings:blacklists');
	const session = await locals.getSession();
	if (!session) throw redirect(302, '/auth/sign-in');

	const id = session.user.id;
	const user = (await db.users.search().where('id').equal(id).first()) as DBUser;
	if (!user) throw error(404, { message: 'auth:user:not:found' });

	if (!user.roles.includes('admin') || !user.roles.includes('superadmin'))
		throw error(401, { message: 'auth:not:authorized' });
	const banned_emails = [
		...(await db.redis.zRange(emailZList, 0, -1)),
		...(await db.redis.zRange(providerZList, 0, -1))
	];

	const vtapikey = await db.getSetting('settings:api:key:vt');

	const whitelistedEmails = [
		...(await db.redis.zRange(whiteEmailZList, 0, -1)),
		...(await db.redis.zRange(whiteProviderZList, 0, -1))
	];

	return {
		banlists: {
			websites: await db.redis.zRange(domainZList, 0, -1),
			usernames: await db.redis.zRange(usernameZList, 0, -1),
			emails: banned_emails
		},
		whitelists: {
			emails: whitelistedEmails
		},
		vtapikey: vtapikey ?? undefined
	};
}

export const actions = {
	async vtApiKey({ request, locals }) {
		const session = await locals.getSession();
		const form = await request.formData();

		if (!session) throw redirect(302, '/');

		const id = session.user.id;
		const user = (await db.users.search().where('id').equal(id).first()) as DBUser;
		if (!user) throw error(404, { message: 'auth:user:not:found' });

		const apikey = form.get('apikey')?.toString().trim();

		if (!apikey || apikey === '') {
			await db.redis.del('settings:api:key:vt');
			return {
				success: 200,
				message: 'settings:app:wise:saved',
				vtapikey: null
			};
		}

		await db.setSetting('settings:api:key:vt', apikey);
		return {
			status: 200,
			message: 'settings:app:wise:saved',
			vtapikey: apikey
		};
	},
	async banDomain({ request, locals }) {
		const session = await locals.getSession();

		if (!session) throw redirect(302, '/');

		const id = session.user.id;
		const user = (await db.users.search().where('id').equal(id).first()) as DBUser;
		if (!user) throw error(404, { message: 'auth:user:not:found' });

		if (!user.roles.includes('admin') || !user.roles.includes('superadmin'))
			throw error(401, { message: 'auth:not:authorized' });

		const form = await request.formData();

		const domain = form.get('domain')?.toString()?.trim();

		if (!domain) return fail(400, { message: 'settings:app:blacklists:domain:errors:missing' });

		const extracted_domain = extractDomain(domain);
		if (!extracted_domain)
			return fail(400, { message: 'settings:app:blacklists:domain:errors:missing' });

		try {
			await db.redis.zAdd(domainZList, { value: extracted_domain, score: new Date().getTime() });
		} catch (error) {
			console.log({ error });
		}

		return {
			status: 200,
			message: 'settings:app:blacklists:domain:add'
		};
	},
	async unBanDomain({ locals, request }) {
		const session = await locals.getSession();

		if (!session) throw redirect(302, '/');

		const id = session.user.id;
		const user = (await db.users.search().where('id').equal(id).first()) as DBUser;
		if (!user) throw error(404, { message: 'auth:user:not:found' });

		if (!user.roles.includes('admin') || !user.roles.includes('superadmin'))
			throw error(401, { message: 'auth:not:authorized' });

		const form = await request.formData();

		const domain = form.get('domain')?.toString()?.trim();

		if (!domain) return fail(400, { message: 'settings:app:blacklists:domain:errors:missing' });

		try {
			await db.redis.zRem(domainZList, domain);
		} catch (error) {
			console.log({ error });
		}

		return {
			status: 200,
			message: 'settings:app:blacklists:domain:removed'
		};
	},
	async banEmail({ request, locals }) {
		const session = await locals.getSession();

		if (!session) throw redirect(302, '/');

		const id = session.user.id;
		const user = (await db.users.search().where('id').equal(id).first()) as DBUser;
		if (!user) throw error(404, { message: 'auth:user:not:found' });

		if (!user.roles.includes('admin') || !user.roles.includes('superadmin'))
			throw error(401, { message: 'auth:not:authorized' });

		const form = await request.formData();

		const email = form.get('email')?.toString()?.trim();

		if (!email) return fail(400, { message: 'settings:app:blacklists:email:errors:missing' });
		if (!email.includes('@'))
			return fail(400, { message: 'settings:app:blacklists:email:errors:format' });

		try {
			if (email.startsWith('@'))
				await db.redis.zAdd(providerZList, { value: email, score: new Date().getTime() });
			else await db.redis.zAdd(emailZList, { value: email, score: new Date().getTime() });
		} catch (error) {
			console.log({ error });
		}

		return {
			status: 200,
			message: 'settings:app:blacklists:email:add'
		};
	},
	async unBanEmail({ locals, request }) {
		const session = await locals.getSession();

		if (!session) throw redirect(302, '/');

		const id = session.user.id;
		const user = (await db.users.search().where('id').equal(id).first()) as DBUser;
		if (!user) throw error(404, { message: 'auth:user:not:found' });

		if (!user.roles.includes('admin') || !user.roles.includes('superadmin'))
			throw error(401, { message: 'auth:not:authorized' });

		const form = await request.formData();

		const email = form.get('email')?.toString()?.trim();

		if (!email) return fail(400, { message: 'settings:app:blacklists:email:errors:missing' });

		try {
			if (email.startsWith('@')) await db.redis.zRem(providerZList, email);
			else await db.redis.zRem(emailZList, email);
		} catch (error) {
			console.log({ error });
		}

		return {
			status: 200,
			message: 'settings:app:blacklists:email:removed'
		};
	},
	async whiteEmail({ request, locals }) {
		const session = await locals.getSession();

		if (!session) throw redirect(302, '/');

		const id = session.user.id;
		const user = (await db.users.search().where('id').equal(id).first()) as DBUser;
		if (!user) throw error(404, { message: 'auth:user:not:found' });

		if (!user.roles.includes('admin') || !user.roles.includes('superadmin'))
			throw error(401, { message: 'auth:not:authorized' });

		const form = await request.formData();

		const email = form.get('email')?.toString()?.trim();

		if (!email) return fail(400, { message: 'settings:app:whitelists:email:errors:missing' });
		if (!email.includes('@'))
			return fail(400, { message: 'settings:app:whitelists:email:errors:format' });
		try {
			if (email.startsWith('@'))
				await db.redis.zAdd(whiteProviderZList, { value: email, score: new Date().getTime() });
			else await db.redis.zAdd(whiteEmailZList, { value: email, score: new Date().getTime() });
		} catch (error) {
			console.log({ error });
		}

		return {
			status: 200,
			message: 'settings:app:whitelists:email:add'
		};
	},
	async unWhiteEmail({ locals, request }) {
		const session = await locals.getSession();

		if (!session) throw redirect(302, '/');

		const id = session.user.id;
		const user = (await db.users.search().where('id').equal(id).first()) as DBUser;
		if (!user) throw error(404, { message: 'auth:user:not:found' });

		if (!user.roles.includes('admin') || !user.roles.includes('superadmin'))
			throw error(401, { message: 'auth:not:authorized' });

		const form = await request.formData();

		const email = form.get('email')?.toString()?.trim();

		if (!email) return fail(400, { message: 'settings:app:whitelists:email:errors:missing' });

		try {
			if (email.startsWith('@')) await db.redis.zRem(whiteProviderZList, email);
			else await db.redis.zRem(whiteEmailZList, email);
		} catch (error) {
			console.log({ error });
		}

		return {
			status: 200,
			message: 'settings:app:blacklists:email:removed'
		};
	},
	async banUsername({ request, locals }) {
		const session = await locals.getSession();

		if (!session) throw redirect(302, '/');

		const id = session.user.id;
		const user = (await db.users.search().where('id').equal(id).first()) as DBUser;
		if (!user) throw error(404, { message: 'auth:user:not:found' });

		if (!user.roles.includes('admin') || !user.roles.includes('superadmin'))
			throw error(401, { message: 'auth:not:authorized' });

		const form = await request.formData();

		const username = form.get('username')?.toString()?.trim();

		if (!username) return fail(400, { message: 'settings:app:blacklists:username:errors:missing' });

		try {
			await db.redis.zAdd(usernameZList, { value: username, score: new Date().getTime() });
		} catch (error) {
			console.log({ error });
		}

		return {
			status: 200,
			message: 'settings:app:blacklists:username:add'
		};
	},
	async unBanUsername({ locals, request }) {
		const session = await locals.getSession();

		if (!session) throw redirect(302, '/');

		const id = session.user.id;
		const user = (await db.users.search().where('id').equal(id).first()) as DBUser;
		if (!user) throw error(404, { message: 'auth:user:not:found' });

		if (!user.roles.includes('admin') || !user.roles.includes('superadmin'))
			throw error(401, { message: 'auth:not:authorized' });

		const form = await request.formData();

		const username = form.get('username')?.toString()?.trim();

		if (!username) return fail(400, { message: 'settings:app:blacklists:username:errors:missing' });

		try {
			await db.redis.zRem(usernameZList, username);
		} catch (error) {
			console.log({ error });
		}

		return {
			status: 200,
			message: 'settings:app:blacklists:username:removed'
		};
	}
};
