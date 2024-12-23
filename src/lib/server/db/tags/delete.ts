import { prisma } from "$lib/server/prisma";

export const delete_tag = async (tagId?: string) => {
  try {
    const deleted = await prisma.tag.delete({
      where: {
        id: tagId,
      },
    });
    return [deleted, null];
  } catch (error) {
    console.log(error);
    return [null, error];
  }
};
