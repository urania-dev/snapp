import { database } from "$lib/server/db/database.js";
import { fail, redirect } from "@sveltejs/kit";

export function load({ locals: { session, user } }) {
  if (!session || !user) redirect(302, "/auth/sign-in");

  return { user };
}

export const actions = {
  default: async ({ request, locals: { session, user }, fetch }) => {
    if (!session || !user) redirect(302, "/auth/sign-in");
    const is_admin = await database.users.is_admin(user.id);
    if (!is_admin) redirect(302, "/dashboard");

    const form = await request.formData();

    const snapp_string = form.get("snapps")?.toString();

    if (!snapp_string) return fail(400, { message: "errors.snapps.not-found" });

    const snapps = JSON.parse(snapp_string) as Partial<Snapp>[];

    for (const snapp of snapps) {
      if (!snapp.original_url) {
        return fail(400, { message: "errors.snapps.original-url-missing" });
      }
      const [, err] = await database.snapps.create(
        { ...snapp },
        user.id,
        fetch,
      );
      if (err) return fail(400, { message: "migrations.failed" });
    }

    return { message: "migrations.success", success: true };
  },
};
