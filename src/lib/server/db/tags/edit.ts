import { prisma } from "$lib/server/prisma";

export const edit_tag = async (
  userId: string,
  name: string,
  slug: string,
  notes?: string,
  tagId?: string,
) => {
  const exists = await prisma.tag.count({
    where: { slug: { startsWith: slug }, id: { not: tagId } },
  });
  const tag = await prisma.tag.update({
    where: {
      id: tagId,
    },
    data: {
      name,
      slug: exists ? `${slug}-${exists}` : slug,
      notes,
      users: { connect: { id: userId } },
    },
  });
  return tag;
};
