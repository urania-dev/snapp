import type { SortingState } from "@tanstack/table-core";

import { fail, redirect } from "@sveltejs/kit";
import { groupSchema } from "$lib/components/groups/schema";
import { log } from "$lib/server/log";
import { ParamsHandler } from "$lib/server/params/index";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";

export const load = async ({ cookies, locals: { prisma, user }, url }) => {
	if (!user) redirect(302, "/auth/sign-in");

	const beParams = new ParamsHandler(url.toString(), cookies, 9, 1);

	const limit = beParams.getLimit();
	beParams.saveLimit(limit);
	const { page, query, sorting } = beParams.getParams();

	const [sort] = JSON.parse(sorting || "[]") as SortingState;
	const groups = await prisma.group.findMany({
		include: { _count: true, snapps: true },
		orderBy:
			sort && sort.id !== "users" && sort.id !== "snapps"
				? { [sort.id]: sort.desc ? "desc" : "asc" }
				: sort && ["snapps", "users"].includes(sort.id)
					? {
							[sort.id]: { _count: sort.desc ? "desc" : "asc" }
						}
					: undefined,
		skip: limit * parseInt(page),
		take: limit,
		where: {
			AND: [
				(query && {
					OR: [
						{
							slug: {
								contains: query
							}
						},
						{
							name: {
								contains: query
							}
						},
						{
							notes: {
								contains: query
							}
						}
					]
				}) ||
					{},

				user && user.role === "user" ? { users: { some: { id: user.id } } } : {}
			]
		}
	});
	const count = await prisma.group.count({
		orderBy:
			sort && sort.id !== "users" && sort.id !== "snapps"
				? { [sort.id]: sort.desc ? "desc" : "asc" }
				: undefined,
		where: {
			AND:
				(query === undefined && [
					{
						OR: [
							{
								slug: {
									contains: query
								}
							},
							{
								name: {
									contains: query
								}
							},
							{
								notes: {
									contains: query
								}
							}
						]
					}
				]) ||
				{}
		}
	});
	return {
		createForm: await superValidate(zod(groupSchema)),
		groups,
		limit: beParams.getLimit(),
		page,
		pageCount: Math.ceil(count / limit),
		query,
		rowCount: count,
		user
	};
};

export const actions = {
	create: async (event) => {
		const {
			locals: { prisma, user }
		} = event;
		if (!user) redirect(302, "/auth/sign-in");
		const createForm = await superValidate(event, zod(groupSchema));
		if (!createForm.valid) {
			return fail(400, {
				createForm
			});
		}

		if (user.role === "user") return fail(401, { message: "errors.not-authorized" });
		try {
			await prisma.group.upsert({
				create: { ...createForm.data },
				update: { ...createForm.data },
				where: { slug: createForm.data.slug }
			});
		} catch (error) {
			log.info(error);
		}

		return { createForm };
	},
	delete: async (event) => {
		const {
			locals: { prisma, user },
			request
		} = event;
		if (!user) redirect(302, "/auth/sign-in");

		const form = await request.formData();

		const ids = form.getAll("ids[]") as string[];
		await prisma.group.deleteMany({ where: { slug: { in: ids } } });
	}
};
