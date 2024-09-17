export const DB_ALREADY_INITIALIZED = 'DB_ALREADY_INITIALIZED' as const;
export const INITIALIZED_DB = 'INITIALIZED_DB' as const;
export const EMAIL_EXISTS = 'EMAIL_EXISTS' as const;
export const USER_EXISTS = 'USER_EXISTS' as const;
export const USER_DOES_NOT_EXISTS = 'USER_DOES_NOT_EXISTS' as const;
export const PASSWORD_IS_INVALID = 'PASSWORD_IS_INVALID' as const;
export const ENABLE_LIMITS = 'ENABLE_LIMITS' as const;
export const ENABLED_SIGNUP = 'ENABLED_SIGNUP' as const;
export const DISABLE_HOME = 'DISABLE_HOME' as const;
export const ALLOW_UNSECURE_HTTP = 'ALLOW_UNSECURE_HTTP' as const;
export const MAX_SNAPPS_PER_USER = 'MAX_SNAPPS_PER_USER' as const;
export const MAX_REQUESTS_PER_DAY = 'MAX_REQUESTS_PER_DAY' as const;
export const MAX_REQUESTS_PER_MINUTE = 'MAX_REQUESTS_PER_MINUTE' as const;
export const VIRUSTOTAL_API_KEY = 'VIRUSTOTAL_API_KEY' as const;
export const VIRUSTOTAL_API_STATUS = 'VIRUSTOTAL_API_STATUS' as const;
export const SMTP_HOST = 'SMTP_HOST' as const;
export const SMTP_USER = 'SMTP_USER' as const;
export const SMTP_PASS = 'SMTP_PASS' as const;
export const SMTP_FROM = 'SMTP_FROM' as const;
export const SMTP_PORT = 'SMTP_PORT' as const;
export const SMTP_SSL = 'SMTP_SSL' as const;
export const SMTP_STATUS = 'SMTP_STATUS' as const;

export const SNAPP_ORIGIN_URL_REQUESTED = 'SNAPP_ORIGIN_URL_REQUESTED' as const;
export const SNAPP_ORIGIN_URL_BLACKLISTED = 'SNAPP_ORIGIN_URL_BLACKLISTED' as const;
export const SNAPP_NOT_FOUND = 'SNAPP_NOT_FOUND' as const;
export const SNAPP_DISABLED = 'SNAPP_DISABLED' as const;
export const UMAMI_URL = 'UMAMI_URL' as const;
export const UMAMI_WEBSITE_ID = 'UMAMI_WEBSITE_ID' as const;

export const UNAUTHORIZED = 'UNAUTHORIZED' as const;

export const NOT_NULL = { not: null } as const;
export const EQUALS_NULL = { equals: null } as const;
