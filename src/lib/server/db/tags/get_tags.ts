import { prisma } from '$lib/server/prisma';
import { getServerSideSettings } from '$lib/server/server-wide-settings';
import { TAGS_AS_PREFIX } from '$lib/utils/constants';

export const get_tags = async (
    userId?: string,
    query?: string,
    limit: number = 10,
    offset: number = 0,
    orderBy: { [key: string]: 'asc' | 'desc' } | undefined = { name: 'asc' }
) => {

    const settings = getServerSideSettings()
    const tagsAsPrefix = settings.get(TAGS_AS_PREFIX)
    const tags = await prisma.tag
        .findMany({
            where: query && userId ? {
                AND: [
                    {
                        users: {
                            some: {
                                id: userId
                            }
                        }
                    },
                    {
                        OR: [
                            {
                                name: {
                                    contains: query
                                }
                            },
                            {
                                slug: {
                                    contains: query
                                }
                            }
                        ]
                    }
                ]
            } : tagsAsPrefix && userId ?
                {
                    users: {
                        some: {
                            id: userId
                        }
                    }
                } : query ? {
                    OR: [
                        { name: { contains: query } },
                        { slug: { contains: query } },
                    ]
                } : query ? {
                    OR: [
                        {
                            name: {
                                contains: query
                            }
                        },
                        {
                            slug: {
                                contains: query
                            }
                        }
                    ]
                } : undefined
            ,
            take: limit,
            skip: Math.abs(offset),
            orderBy: orderBy,
            include: {
                _count: true,
            }
        })
    const count = await prisma.tag.count();

    return [tags, count] as [typeof tags, number];
};
