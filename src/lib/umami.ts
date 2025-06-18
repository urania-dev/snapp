import type { RequestEvent } from '@sveltejs/kit';

import {Umami} from '@umami/node';
import { env as privateEnv } from '$env/dynamic/private';
import { env } from '$env/dynamic/public';

import { getSettings } from './server/config';
import { log } from './server/log';


export const getUmami = (hostUrl:string, websiteId:string, userAgent?:string)=>{
	if(!hostUrl||hostUrl.trim() === '') return
    //~ init
    const umamiClient = new Umami({
        hostUrl, 
        userAgent,
        websiteId
    });
    
 
    return umamiClient
}

export const logSnappNotFound = async (event: RequestEvent) => {
	const settings = await getSettings()
	const umamiURL = settings.get<string>('PUBLIC_UMAMI_WEBSITE_URL');
	const umamiID = settings.get<string>('PUBLIC_UMAMI_WEBSITE_ID');
	if (!!umamiID && !!umamiURL) {
		const url = new URL(event.url)
		const payload = {
			data: undefined as { [key: string]: string } | undefined,
			hostname: event.url.hostname,
			language: event.locals.lang,
			name: "# ALERT # URL not found",
			referrer: event.request.referrer,
			screen: '--SSR',
			title: `/${event.params.shortcode}`,
			url,
			website: umamiID,
		};
		const userAgent = event.request.headers.get('user-agent')?.toString()
		try {
			const umami = getUmami(umamiURL, umamiID, userAgent)
			await umami?.track(payload)
		} catch (error) {
			if (privateEnv.LOG_LEVEL === 'debug')
				log.error(error)
		}
	}
}


export const logSecretInvalidOnSnapp = async (event: RequestEvent) => {
	const settings = await getSettings()
	const umamiURL = settings.get<string>('PUBLIC_UMAMI_WEBSITE_URL');
	const umamiID = settings.get<string>('PUBLIC_UMAMI_WEBSITE_ID');
	if (!!umamiID && !!umamiURL) {
		const url = new URL(event.url)
		const payload = {
			data: undefined as { [key: string]: string } | undefined,
			hostname: event.url.hostname,
			language: event.locals.lang,
			name: "# ALERT # Invalid Privte URL secret",
			referrer: event.request.referrer,
			screen: '--SSR',
			title: `/${event.params.shortcode}`,
			url,
			website: umamiID,
		};
		const userAgent = event.request.headers.get('user-agent')?.toString()
		try {
			const umami = getUmami(umamiURL, umamiID, userAgent)
			await umami?.track(payload)
		} catch (error) {
			if (privateEnv.LOG_LEVEL === 'debug')
				log.error(error)
		}
	}
}


export const logDatabaseNotAvailable = async(event:RequestEvent)=>{
	// as the db is offline we don't call settings
	const umamiURL = env.PUBLIC_UMAMI_WEBSITE_URL
	const umamiID = env.PUBLIC_UMAMI_WEBSITE_ID
	if (!!umamiID && !!umamiURL) {
		const url = new URL(event.url)
		const payload = {
				data: undefined as { [key: string]: string } | undefined,
				hostname: event.url.hostname,
				language:event.locals.lang,
				name:"# ALERT # Database offline",
				referrer:event.request.referrer,
				screen: '--SSR',
				title: `/auth/sign-in`,
				url,
				website: umamiID,
		};
		const userAgent = event.request.headers.get('user-agent')?.toString()
		try {
			const umami = getUmami(umamiURL,umamiID,userAgent)
				await umami?.track(payload)
			} catch (error) {
				if(privateEnv.LOG_LEVEL==='debug')
					log.error(error)
			}
	}
}


export const logInvalidLoginAttempt = async(event:RequestEvent)=>{
	const settings = await getSettings()
	const umamiURL = settings.get<string>('PUBLIC_UMAMI_WEBSITE_URL');
	const umamiID = settings.get<string>('PUBLIC_UMAMI_WEBSITE_ID');
	if (!!umamiID && !!umamiURL) {
		const url = new URL(event.url)
		const payload = {
				data: undefined as { [key: string]: string } | undefined,
				hostname: event.url.hostname,
				language:event.locals.lang,
				name:"# ALERT # Invalid Login Attempt",
				referrer:event.request.referrer,
				screen: '--SSR',
				title: `/auth/sign-in`,
				url,
				website: umamiID,
		};
		const userAgent = event.request.headers.get('user-agent')?.toString()
		try {
			const umami = getUmami(umamiURL,umamiID,userAgent)
				await umami?.track(payload)
			} catch (error) {
				if(privateEnv.LOG_LEVEL==='debug')
					log.error(error)
			}
	}
}