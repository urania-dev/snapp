import { prisma } from "$lib/server/prisma";

export const get_one_by_id = async (id: string) => {
    const user = await prisma.user.findFirst({ where: { id } });

    return user 
};
