import { ENABLED_SIGNUP, INITIALIZED_DB, USER_EXISTS } from '$lib/utils/constants';
import { env } from '$env/dynamic/private';
import { parse_db_setting } from '$lib/server/db/helpers/parse_db_setting';
import { create_user } from './users/create';
import { set_setting } from './settings/set';
import { get_setting } from './settings/get';
import { authenticate } from './users/authenticate';
import { update_user } from './users/update';
import { get_token } from './tokens/get';
import { create_token } from './tokens/create';
import { delete_token } from './tokens/delete';
import { is_admin } from './users/is_admin';
import { is_admin_token } from './tokens/is_admin';
import { delete_settings } from './settings/delete';
import { get_expirable_setting } from './settings/get_expirable';
import { set_watchlist } from './watchlists/set';
import { check_watchlist } from './watchlists/check';
import { get_list } from './watchlists/get_list';
import { count_watchlisted } from './watchlists/count';
import { delete_watchlist } from './watchlists/delete';
import { get_users } from './users/get';
import { get_one } from './users/get_one';
import { createPasswordResetToken } from './users/password_token';
import { delete_user } from './users/delete';
import { create_snapp } from './snapps/create';
import { get_snapp } from './snapps/get';
import { validate } from './snapps/validate_url';
import { edit_snapp } from './snapps/edit';
import { get_one_snapp } from './snapps/get_one';
import { delete_snapp } from './snapps/delete';
import { get_one_by_id } from './users/get_one_by_id';
import { get_one_snapp_by_id } from './snapps/get_one_by_id';

export class Database {
	constructor() {
		this.init();
	}

	// SETTINGS
	public settings = {
		set: set_setting,
		get: get_setting,
		expirable: get_expirable_setting,
		parse: parse_db_setting,
		delete: delete_settings
	};

	// USERS
	public users = {
		create: create_user,
		authenticate,
		update: update_user,
		get: get_users,
		one: get_one,
		id: get_one_by_id,
		is_admin,
		reset_token: createPasswordResetToken,
		delete: delete_user
	};

	// SNAPPS
	public snapps = {
		create: create_snapp,
		edit: edit_snapp,
		delete: delete_snapp,
		get: get_snapp,
		id: get_one_snapp_by_id,
		one: get_one_snapp,
		validate: validate
	};

	public tokens = {
		get: get_token,
		create: create_token,
		delete: delete_token,
		is_admin: is_admin_token
	};

	public watchlist = {
		set: set_watchlist,
		list: get_list,
		check: check_watchlist,
		count: count_watchlisted,
		delete: delete_watchlist
	};

	private init = async () => {
		const is_initialized = this.settings.parse(await this.settings.get(INITIALIZED_DB), true);
		if (is_initialized) return;

		const admin_username = env.ADMIN_USERNAME || 'admin';
		const admin_password = env.ADMIN_PASSWORD || 'password';
		const admin_email = env.ADMIN_EMAIL || 'admin@example.com';

		const [user, error] = await this.users.create(
			admin_username,
			admin_email,
			admin_password,
			undefined,
			'root'
		);
		await this.settings.set(ENABLED_SIGNUP, 'false');

		if (error && error === USER_EXISTS) return console.log(USER_EXISTS);
		else await this.settings.set(INITIALIZED_DB, 'true');
	};
}

const database = globalThis._db || new Database();

if (!globalThis._db) globalThis._db = database;

export { database };
