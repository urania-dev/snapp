import { authenticate_api } from "$lib/server/authenticate-api";
import { database } from "$lib/server/db/database";
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

  const slug = event.params.slug;
  const limit = parseInt(
    event.url.searchParams.get("limit")?.toString() || "10",
  );
  const offset = parseInt(
    event.url.searchParams.get("offset")?.toString() || "0",
  );
  const orderBy = event.url.searchParams.get("order-by")?.toString() ||
    undefined;
  const ascending =
    event.url.searchParams.get("ascending")?.toString() === "true" || false;

  const [tags, count] = await database.tags.one(
    slug,
    limit,
    offset,
    orderBy
      ? {
        [orderBy]: ascending ? "asc" : "desc",
      }
      : undefined,
  );

  return json({
    tags,
    total: count,
    pagination: { limit, offset, slug, orderBy, ascending },
  });
};
