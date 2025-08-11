import { getUmami } from "$lib/umami-client";

export const load = async({ data, fetch, url }) => {
    const userAgent = data.userAgent || undefined;
    const umami = getUmami(data.umami.url || '', data.umami.id || '', userAgent);
    await umami?.track({ title: '/', url });
    return { ...data, fetch };
};
