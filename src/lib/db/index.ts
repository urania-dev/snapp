import { createClient } from 'redis';
import { env } from '$env/dynamic/private';
import { Repository } from 'redis-om';
// schema
import userSchema from './users';
import apiKeysSchema from './apiKeys';
import snappsSchema from './snapps';
import usagesSchema from './usages';
// settings
import getSetting from './settings/get';
import setSetting from './settings/set';
// users
import signupUser from './users/signup';
import signinUser from './users/signin';
import updateUser from './users/update';
import deleteUser from './users/delete';
import admin from './users/admin';
// snapps
import shortenSnapp from './snapps/shorten';
import editSnapp from './snapps/edit';
import authorship from './snapps/authorship';
import checkRPMLimit from './rpm';
import checkRPDLimit from './rpd';
import isWhiteListed from './users/isWhiteListed';
import isBlackListed from './users/isBlackListed';
import isBlackListedEmail from './users/isEmailBlackListed';
import trackMaxURLs from './settings/trackMaxURLs';
import trackRPDandRPM from './settings/trackRDPandRPM';
import hasWhiteList from './snapps/has_whitelist';

export const domainZList = 'settings:app:banlists:website' as const;
export const usernameZList = 'settings:app:banlists:username' as const;
export const emailZList = 'settings:app:banlists:email' as const;
export const providerZList = 'settings:app:banlists:provider' as const;
export const whiteEmailZList = 'settings:app:whitelists:email' as const;
export const whiteProviderZList = 'settings:app:whitelists:provider' as const;

export class Database {
	redis: typeof client;
	users: Repository;
	apikeys: Repository;
	usages: Repository;
	snapps: Repository;
	constructor(redis: typeof client) {
		this.redis = redis;
		this.users = new Repository(userSchema, redis);
		this.snapps = new Repository(snappsSchema, redis);
		this.apikeys = new Repository(apiKeysSchema, redis);
		this.usages = new Repository(usagesSchema, redis);
	}

	signinUser = signinUser.bind(this);
	signupUser = signupUser.bind(this);
	updateUser = updateUser.bind(this);
	deleteUser = deleteUser.bind(this);
	admin = admin.bind(this);

	shorten = shortenSnapp.bind(this);
	edit = editSnapp.bind(this);
	authorship = authorship.bind(this);

	getSetting = getSetting.bind(this);
	setSetting = setSetting.bind(this);

	rpm = checkRPMLimit.bind(this);
	rpd = checkRPDLimit.bind(this);

	trackMaxURLs = trackMaxURLs.bind(this);
	trackRPDandRPM = trackRPDandRPM.bind(this);

	whitelisted = isWhiteListed.bind(this);
	blacklisted = isBlackListed.bind(this);
	blacklistedEmail = isBlackListedEmail.bind(this);

	hasWhiteList = hasWhiteList.bind(this);
}

const client = await createClient({
	url: `redis://default:${env.DB_PASS}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_IDX}`
}).connect();

const db = new Database(client);

export { db };
