import { prisma } from "$lib/server/prisma";

export const create_tag = async (
  userId: string,
  name: string,
  slug: string,
  notes?: string,
) => {
  const exists = await prisma.tag.count({
    where: { slug: { startsWith: slug } },
  });
  const existsName = await prisma.tag.count({
    where: { slug: { startsWith: slug } },
  });
  const tag = await prisma.tag.create({
    data: {
      name: existsName ? `${name}-${existsName}` : name,
      slug: exists ? `${slug}-${exists}` : slug,
      notes,
      users: { connect: { id: userId } },
    },
  });
  return tag;
};
