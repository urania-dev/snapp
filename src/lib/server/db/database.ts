import {
  ALLOW_UNSECURE_HTTP,
  DISABLE_HOME,
  ENABLED_SIGNUP,
  INITIALIZED_DB,
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_SSL,
  SMTP_USER,
  UMAMI_URL,
  UMAMI_WEBSITE_ID,
  USER_EXISTS,
  VIRUSTOTAL_API_KEY,
} from "$lib/utils/constants";
import { env } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { parse_db_setting } from "$lib/server/db/helpers/parse_db_setting";
import { create_user } from "./users/create";
import { set_setting } from "./settings/set";
import { get_setting } from "./settings/get";
import { authenticate } from "./users/authenticate";
import { update_user } from "./users/update";
import { get_token } from "./tokens/get";
import { create_token } from "./tokens/create";
import { delete_token } from "./tokens/delete";
import { is_admin } from "./users/is_admin";
import { is_admin_token } from "./tokens/is_admin";
import { delete_settings } from "./settings/delete";
import { get_expirable_setting } from "./settings/get_expirable";
import { set_watchlist } from "./watchlists/set";
import { check_watchlist } from "./watchlists/check";
import { get_list } from "./watchlists/get_list";
import { count_watchlisted } from "./watchlists/count";
import { delete_watchlist } from "./watchlists/delete";
import { get_users } from "./users/get";
import { get_one } from "./users/get_one";
import { createPasswordResetToken } from "./users/password_token";
import { delete_user } from "./users/delete";
import { create_snapp } from "./snapps/create";
import { get_snapp } from "./snapps/get";
import { validate } from "./snapps/validate_url";
import { edit_snapp } from "./snapps/edit";
import { get_one_snapp } from "./snapps/get_one";
import { delete_snapp } from "./snapps/delete";
import { get_one_by_id } from "./users/get_one_by_id";
import { get_one_snapp_by_id } from "./snapps/get_one_by_id";
import { validate_otp } from "./users/validate_otp";
import { update_two_factor_secret } from "./users/update_mfa";
import { get_tags } from "./tags/get_tags";
import { create_tag } from "./tags/create";
import { edit_tag } from "./tags/edit";
import { delete_tag } from "./tags/delete";
import { get_one_tag } from "./tags/get_one";

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
    delete: delete_settings,
  };

  // USERS
  public users = {
    create: create_user,
    authenticate: authenticate,
    validate_otp: validate_otp,
    update_two_factor_secret: update_two_factor_secret,
    update: update_user,
    get: get_users,
    one: get_one,
    id: get_one_by_id,
    is_admin,
    reset_token: createPasswordResetToken,
    delete: delete_user,
  };

  // SNAPPS
  public snapps = {
    create: create_snapp,
    edit: edit_snapp,
    delete: delete_snapp,
    get: get_snapp,
    id: get_one_snapp_by_id,
    one: get_one_snapp,
    validate: validate,
  };

  //TAGS
  public tags = {
    get: get_tags,
    one: get_one_tag,
    create: create_tag,
    edit: edit_tag,
    delete: delete_tag,
  };

  public tokens = {
    get: get_token,
    create: create_token,
    delete: delete_token,
    is_admin: is_admin_token,
  };

  public watchlist = {
    set: set_watchlist,
    list: get_list,
    check: check_watchlist,
    count: count_watchlisted,
    delete: delete_watchlist,
  };

  private init = async () => {
    const is_initialized = this.settings.parse(
      await this.settings.get(INITIALIZED_DB),
      true,
    );
    if (is_initialized) return;

    const admin_username = env.ADMIN_USERNAME || "admin";
    const admin_password = env.ADMIN_PASSWORD || "password";
    const admin_email = env.ADMIN_EMAIL || "admin@example.com";

    const [user, error] = await this.users.create(
      admin_username.toLowerCase(),
      admin_email,
      admin_password,
      undefined,
      "root",
    );

    const ENV_ENABLE_SIGNUP = env.ENABLE_SIGNUP || "false";
    await this.settings.set(ENABLED_SIGNUP, ENV_ENABLE_SIGNUP);

    if (error && error === USER_EXISTS) {
      console.log("ADMIN Already exists. Skipped creation");
    }

    const ENV_UMAMI_URL = publicEnv.PUBLIC_UMAMI_URL;
    const ENV_UMAMI_WEBSITE_ID = publicEnv.PUBLIC_UMAMI_WEBSITE_ID;

    if (ENV_UMAMI_URL !== undefined && ENV_UMAMI_WEBSITE_ID !== undefined) {
      await this.settings.set(UMAMI_URL, ENV_UMAMI_URL);
      await this.settings.set(UMAMI_WEBSITE_ID, ENV_UMAMI_WEBSITE_ID);
      console.log("UMAMI Integration: configuration added to the database.");
    }

    const ENV_DISABLE_HOME = env.DISABLE_HOME || "false";
    await this.settings.set(DISABLE_HOME, ENV_DISABLE_HOME);
    if (ENV_DISABLE_HOME && ENV_DISABLE_HOME === "true") {
      console.log("Disable Home: configuration added to the database.");
    }

    const ENV_ALLOW_HTTP = env.ALLOW_UNSECURE_HTTP === "true" || false;
    if (ENV_ALLOW_HTTP) {
      await this.settings.set(ALLOW_UNSECURE_HTTP, String(ENV_ALLOW_HTTP));
      console.log("Allow Unsecure HTTP: configuration added to the database.");
    }

    const ENV_SMTP_HOST = env.SMTP_HOST || null;
    const ENV_SMTP_PORT = env.SMTP_PORT || null;
    const ENV_SMTP_USER = env.SMTP_USER || null;
    const ENV_SMTP_PASS = env.SMTP_PASS || null;
    const ENV_SMTP_FROM = env.SMTP_FROM || null;
    const ENV_SMTP_SSL = env.SMTP_SSL || true;
    const ENV_VTAPIKEY = env.VTAPI_KEY || null;

    if (ENV_SMTP_HOST) await this.settings.set(SMTP_HOST, ENV_SMTP_HOST);
    if (ENV_SMTP_PORT) await this.settings.set(SMTP_PORT, ENV_SMTP_PORT);
    if (ENV_SMTP_USER) await this.settings.set(SMTP_USER, ENV_SMTP_USER);
    if (ENV_SMTP_PASS) await this.settings.set(SMTP_PASS, ENV_SMTP_PASS);
    if (ENV_SMTP_FROM) await this.settings.set(SMTP_FROM, ENV_SMTP_FROM);
    if (ENV_SMTP_SSL) {
      await this.settings.set(SMTP_SSL, ENV_SMTP_SSL?.toString());
    }
    if (ENV_VTAPIKEY) await this.settings.set(VIRUSTOTAL_API_KEY, ENV_VTAPIKEY);
    if (ENV_VTAPIKEY) {
      console.log("VirusTotal API Key: configuration added to the database.");
    }
    if (ENV_SMTP_HOST) {
      console.log("SMTP Setup: configuration added to the database.");
    }

    await this.settings.set(INITIALIZED_DB, "true");
  };
}

const database = globalThis._db || new Database();

if (!globalThis._db) globalThis._db = database;

export { database };
