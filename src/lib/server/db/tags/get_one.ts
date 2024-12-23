import { prisma } from "$lib/server/prisma";

export const get_one_tag = async (
  slug: string,
  limit: number = 10,
  offset: number = 0,
  orderBy: { [key: string]: "asc" | "desc" } | undefined = { shortcode: "asc" },
) => {
  const tag = await prisma.tag.findFirst({
    where: { slug },
    include: {
      snapps: {
        take: limit,
        skip: offset,
        orderBy: orderBy,
      },
    },
  }).then((r) => ({
    ...r,
    snapps: r?.snapps.map((s) => ({
      ...s,
      secret: s.secret !== null ? true : false,
    })),
  }));
  if (!tag) return [null, "TAG NOT FOUND"] as [null, string];

  return [tag, null] as [typeof tag, null];
};
