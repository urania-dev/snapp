import { prisma } from "$lib/db/prisma";
import { sleep } from "$lib/utils";

import { DEBUG, getSettings, ServerWideSettings } from "../config";
import { log } from "../log";

class WatchLists {
	checkDomain = async (path: string) => {
		const url = new URL(path);
		const domain = url.hostname;
		const blackListed = await prisma.watchList.findFirst({
			where: {
				allowed: false,
				domain
			}
		});
		const whiteListed = await prisma.watchList.findFirst({
			where: {
				allowed: true,
				domain
			}
		});

		return [whiteListed?.allowed === true || false, blackListed?.allowed === false || false];
	};
	checkEmail = async (email: string) => {
		return await prisma.$transaction(async (tx) => {
			const [username, domain] = email.split("@");
			const whiteList = await tx.watchList.findMany({
				where: {
					OR: [{ allowed: true }]
				}
			});

			const whiteListed = whiteList?.filter((d) => d.allowed);
			if (whiteListed.length) {
				const isWhitelisted = whiteListed.find((w) => w.domain === domain) !== undefined || false;
				return isWhitelisted;
			}

			const res = await tx.watchList.findFirst({
				where: {
					OR: [
						{ domain, username: "*" },
						{ domain, username }
					]
				}
			});

			return (res?.allowed === true || res === null || false) as boolean;
		});
	};
	checkUsername = async (username: string) => {
		const res = await prisma.watchList.findFirst({
			where: { domain: null, username }
		});
		return (res?.allowed === true || res === null || false) as boolean;
	};
	checkVTApiKeyStatus = async (f: typeof fetch, key?: null | string) => {
		if (!key) return true;

		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		try {
			const exists = await prisma.setting.findFirst({
				where: { id: "VTAPI_STATUS" }
			});

			if (exists && exists.created > yesterday) {
				return true;
			}
			const domain = "www.virustotal.com";
			const encodedParams = new URLSearchParams();
			encodedParams.set("url", domain);
			const _url = "https://www.virustotal.com/api/v3/urls";
			const _options = {
				body: encodedParams,
				headers: {
					accept: "application/json",
					"content-type": "application/x-www-form-urlencoded",
					"x-apikey": key
				},
				method: "POST"
			};
			const res = await (await f(_url, { ..._options })).json();

			if (!res?.data?.links) return false;
			await sleep(500);
			const analysis = await (
				await f(res.data.links.self, {
					headers: {
						"x-apikey": key
					}
				})
			).json();
			if (typeof analysis === "object") {
				await prisma.setting.upsert({
					create: { field: "VTAPI_STATUS", id: "VTAPI_STATUS", value: "true" },
					update: { value: "true" },
					where: { id: "VTAPI_STATUS" }
				});
				return true;
			} else {
				await prisma.setting.delete({ where: { id: "VTAPI_STATUS" } });
				return false;
			}
		} catch (error) {
			log.error(error);
		}
		return false;
	};
	domainFromUrl = (url: string) => {
		let result: string = "";
		let match: null | RegExpMatchArray = url.match(
			/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?=]+)/im
		);
		if (match) {
			result = match[0];
			match = result.match(/^[^.]+\.(.+\..+)$/);
			if (match) {
				result = match[0];
			}
		}
		return result;
	};

	getFresh = async (domain: string, _fetch: typeof fetch, VT_APIKEY: string) => {
		const encodedParams = new URLSearchParams();
		encodedParams.set("url", domain);
		const _url = "https://www.virustotal.com/api/v3/urls";
		const _options = {
			body: encodedParams,
			headers: {
				accept: "application/json",
				"content-type": "application/x-www-form-urlencoded",
				"x-apikey": VT_APIKEY
			},
			method: "POST"
		};
		const res = await (await _fetch(_url, _options)).json();

		const analysis = await (
			await _fetch(res.data.links.self, {
				headers: {
					"x-apikey": VT_APIKEY
				}
			})
		).json();
		if (DEBUG) log.info(analysis);
		return analysis.data.attributes.stats;
	};
	hasExceededSnappLimit = async (userId: string): Promise<boolean> => {
		const settings = await getSettings();
		const isLimited = settings.get<boolean>("ENABLE_LIMITS");
		if (!isLimited) return false;
		const snappsByUser = await prisma.snapp.count({ where: { userId } });

		const defaultMaxSnapps = settings.get<number>("MAX_SNAPPS_PER_USER");
		const userSpecificMaxSnapps = parseInt(
			(
				await prisma.setting.findFirst({
					where: { field: "MAX_SNAPPS_PER_USER", userId }
				})
			)?.value ||
				`${defaultMaxSnapps}` ||
				"0"
		);
		return userSpecificMaxSnapps > 0 && snappsByUser > userSpecificMaxSnapps;
	};
	testHTTPS = (domain: string, settings: ServerWideSettings) => {
		try {
			const isUnsecureHTTPAllowed = settings.get<boolean>("ALLOW_UNSECURE_HTTP");
			const url = new URL(domain);

			if (!isUnsecureHTTPAllowed && url.protocol !== "https:") return false;
			return true;
		} catch (error) {
			if (DEBUG) log.error(error);
		}
		return false;
	};

	validateURL = async (
		test: string
	): Promise<{
		errors: {
			blacklist: "errors.snapps.original-url-blacklisted" | null;
			https: "errors.snapps.unallowed-not-https" | null;
			missingUrl: "errors.snapps.original-url-missing" | null;
		};
		valid: boolean;
	}> => {
		if (typeof test !== "string") {
			return {
				errors: {
					blacklist: null,
					https: null,
					missingUrl: "errors.snapps.original-url-missing"
				},
				valid: false
			};
		}
		const settings = await getSettings();
		const domain = this.domainFromUrl(test.toLowerCase());

		const isHTTPS = this.testHTTPS(domain, settings);
		const [isWhitelisted, isBlacklisted] = await this.checkDomain(domain);
		const isClean = await this.vtApiCheck(domain, settings);
		return {
			errors: {
				blacklist:
					((isClean === false || isBlacklisted) && "errors.snapps.original-url-blacklisted") ||
					null,
				https: (isHTTPS === false && "errors.snapps.unallowed-not-https") || null,
				missingUrl: null
			},
			valid: isWhitelisted || (isHTTPS && isBlacklisted === false && isClean)
		};
	};

	vtApiCheck = async (domain: string, settings: ServerWideSettings) => {
		const _30DaysAgo_ = new Date();
		_30DaysAgo_.setMonth(new Date().getMonth() - 1);

		const vtApiKey = settings.get<string>("VTAPI_KEY");
		if (!vtApiKey) return true;

		try {
			await prisma.vtApiCache.deleteMany({
				where: { createdAt: { lt: _30DaysAgo_ } }
			});
			const cached = await prisma.vtApiCache.findFirst({ where: { domain } });
			const response = cached
				? JSON.parse(cached.result)
				: await this.getFresh(domain, fetch, vtApiKey);

			if (!cached) {
				await prisma.vtApiCache.upsert({
					create: {
						domain,
						result: JSON.stringify(response)
					},
					update: {},
					where: { domain }
				});
			}

			const is_clean = response.malicious === 0 || response.malicious < response.harmless;

			return is_clean;
		} catch (error) {
			if (DEBUG) log.error(error);
			return true;
		}
	};
}

export const watchLists = new WatchLists();
