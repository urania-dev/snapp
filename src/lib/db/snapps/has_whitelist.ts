import { whiteEmailZList, whiteProviderZList, type Database } from "..";

export default async function hasWhiteList(this: Database, ) {
    const has_whitelists = await this.redis.zCard(whiteEmailZList);
    const has_whitelisted_providers = await this.redis.zCard(whiteProviderZList);
    if (
        (!has_whitelists || has_whitelists === 0) &&
        (!has_whitelisted_providers || has_whitelisted_providers === 0)
    )
        return false;
    else return true;
}