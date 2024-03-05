import { createClient } from 'redis';
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
import trackRPDandRPM from './settings/trackRPDandRPM';
import hasWhiteList from './snapps/has_whitelist';
import checkRepoInfo from './repoInfo';
import { env } from '$env/dynamic/private';

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
		signinUser.bind(this);
		signupUser.bind(this);
		updateUser.bind(this);
		deleteUser.bind(this);
		admin.bind(this);
		shortenSnapp.bind(this);
		editSnapp.bind(this);
		authorship.bind(this);
		getSetting.bind(this);
		setSetting.bind(this);
		checkRPMLimit.bind(this);
		checkRPDLimit.bind(this);
		trackMaxURLs.bind(this);
		trackRPDandRPM.bind(this);
		isWhiteListed.bind(this);
		isBlackListed.bind(this);
		isBlackListedEmail.bind(this);
		hasWhiteList.bind(this);
		checkRepoInfo.bind(this);
	}

	signinUser = signinUser;
	signupUser = signupUser;
	updateUser = updateUser;
	deleteUser = deleteUser;
	admin = admin;

	shorten = shortenSnapp;
	edit = editSnapp;
	authorship = authorship;

	getSetting = getSetting;
	setSetting = setSetting;

	rpm = checkRPMLimit;
	rpd = checkRPDLimit;

	trackMaxURLs = trackMaxURLs;
	trackRPDandRPM = trackRPDandRPM;

	whitelisted = isWhiteListed;
	blacklisted = isBlackListed;
	blacklistedEmail = isBlackListedEmail;

	hasWhiteList = hasWhiteList;

	repoInfo = checkRepoInfo;
}
let password = env.DB_PASS ?? '';
let host = env.DB_HOST ?? '';
let port = env.DB_PORT ?? '6379';
let dbIndex = env.DB_IDX ?? '0';

async function getClient() {
	if (env.DB_HOST)
		return await createClient({
			url: `redis://default:${password}@${host}:${port}/${dbIndex}`
		})
			.on('error', (err) => {
				console.log(err);
			})
			.connect();
	else throw new Error('This version of Snapps requires REDIS STACK, please read documentation');
}

const client = await getClient();
const db = new Database(client);

export { db };
