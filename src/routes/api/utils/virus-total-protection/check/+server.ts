import { authenticate_api } from "$lib/server/authenticate-api";
import { database } from "$lib/server/db/database.js";
import { rateLimiterCheck } from "$lib/server/ratelimiter";
import { error, json } from "@sveltejs/kit";

export const GET = async (event) => {
  const token = await authenticate_api(event);
  if (!token) error(403);
  const limits = token.user.role === "user"
    ? await rateLimiterCheck(token.key)
    : null;
  if (limits?.blocked) {
    return json({ message: "Too many requests" }, { status: 429 });
  }

  const res = await database.snapps.validate("snapp.li", event.fetch);

  return json(res);
};
