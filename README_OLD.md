# Snapp

If you're seeking a self-hosted URL shortening solution, Snapp might be what you
need. It's designed for those who value control over their URL management and
want to explore various technologies.

## A Brief Introduction

This project began as a personal endeavor to explore new technologies and make
use of free time. With version 0.7, some development issues emerged, prompting a
complete redesign and rebuild. By version 0.8, we've laid the groundwork for
what will become the first version 1.

Currently, you can migrate URLs between versions using a CSV export tool. Note
that these files are only valid for direct transitions from one version to the
next; for example, exports from version 0.6 to 0.7 won't work for moving from
0.7 to 0.8. We’ve reverted to using Prisma to ensure a more stable and
maintainable platform going forward.

This latest version supports multiple architectures, including ARM and ARM64
platforms, and offers integration with various databases, now accessible with
just a ENV Variable.

### 2025 Update

The app has undergone a major refactor, bringing numerous improvements,
including a fresh UI built with ShadCN and Svelte. The platform is now stable
and mature enough to be considered a release candidate. This will need a new
reinitiation of a plain database, so export your URL and be prepared to a new
importer that should be able to guide you assign any kind of CSV to the
platform.

Please, note that for the time being the release candidate will be updated as
fixed version. Once stable will be released as Latest and v.1.0.0.

## Features

- **Intuitive User Interface:** Snapp offers a user-friendly interface for easy
  link shortening.
- **Secure Authentication:** Enjoy secure sessions for your user. Their
  information is protected.
- **Custom Short Codes:** Personalize your short codes to make your links
  memorable and easy to share.
- **Expiration Dates:** Manage link lifespans with expiration dates. You can set
  expiry dates for added security or let links remain active indefinitely.
- **Secret Links:** Enhance security with secret links, allowing you to share
  with a select audience using unique secrets.
- **Usage Analytics:** Access detailed, anonymous analytics for your links.
  Snapp provides insights into link engagements.
- **Extended Metrics:** Integrate Snapp with your self-hosted or cloud-based
  Umami Analytics for advanced metrics.
- **URL Reputation Check:** Ensure the safety of links with VirusTotal API
  reputation checks.
- **REST API:** Community-requested REST API endpoints enable remote management
  of your Snapp instance. Find all Scalar Docs [here](https://snapp.li/docs).

---
## This is a major refactor, the database has been rewritten
### Always backup before attempting any update
---

## Getting Started

Snapp is an open-source platform you can host yourself.

```yml
services:
  snapp:
    image: uraniadev/snapp:0.9-rc-021
    ports:
      - 3000:3000
    environment:
      DATABASE_URL: "file:./db.sqlite"
      DATABASE_PROVIDER: sqlite # mysql | sqlite | postgres
      TOKEN_SECRET: # openssl rand -base64 32
      ORIGIN: https://example.com
```

**Note**: SQLite database is located in
/app/dbschema/sqlite/prisma/{DATABASE_URL} if you want to mount it

**_Update8.1_**: ~~In order to make it actually work it ended up requiring
better~~ ~~specification of schemas for Prisma Clients, the combinations are:~~

**_Update0.9-rc_**: Now integrate Zenstack and improved ENV definition to
restrict:

```sh
DATABASE_PROVIDER=sqlite # postgres | mysql
DATABASE_URL=file:./db.sqlite
# DATABASE_URL=mysql://root:password@localhost:3306/db
# DATABASE_URL=postgres://root:password@localhost:5432/db
```

## Default Admin Authentication

If ENV variables ADMIN_USERNAME and ADMIN_PASSWORD are not set it defaults to
the very secure:

```
username: admin
password: password
```

You can always set a SMTP server and use password recovery process to change it
later. (not very secure tho...)

## I18N

Snapp at his version 0.8 includes from start Italian, English, German, French,
Spanish and Galician. This are very amateurish translation with the help of
ChatGPT, so errors are to be expected, feel free to open a related issue if any

## Migration

The latest versions of Snapp include CSV Export to facilitate migration. Simply
log in and import your URLs from the dashboard, and continue from where you
left.

## ENV Variables

Some configuration moved from envs variable to settings page in-app, thou there
are some ENV that could be set as default on first launch, here's the complete list with the page using the env variable:

```bash
ADMIN_PASSWORD= 
# src\hooks.server.ts
ADMIN_EMAIL= 
# src\hooks.server.ts
# src\routes\db-error\+page.server.ts
ADMIN_USERNAME= 
# src\hooks.server.ts
LOG_LEVEL= 
# src\hooks.server.ts
# src\lib\server\auth\oidc\config.ts
# src\lib\server\config\index.ts
# src\lib\server\smtp\index.ts
# src\lib\server\snapps\markUsage.ts
# src\lib\server\watchlists\index.ts
# src\routes\+page.server.ts
# src\routes\admin\check-export\[id]\+server.ts
# src\routes\admin\check-vt-api\+server.ts
# src\routes\admin\refresh-export\[id]\+server.ts
# src\routes\auth\sign-up\+page.server.ts
# src\routes\auth\[provider]\+page.server.ts
# src\routes\dashboard\+page.server.ts
# src\routes\db-error\+page.server.ts
# src\routes\settings\+page.server.ts
DEBUG= 
# src\lib\server\auth\db.ts
NODE_ENV= 
# src\lib\server\auth\index.ts
# src\lib\server\params\index.ts
# src\routes\+page.server.ts
# src\routes\auth\mfa\setup\+page.server.ts
# src\routes\auth\[provider]\+page.server.ts
# src\routes\settings\+page.server.ts
ALLOW_UNSECURE_HTTP= 
# src\lib\server\config\index.ts
APPNAME= 
# src\lib\server\config\index.ts
DISABLE_HOME= 
# src\lib\server\config\index.ts
ENABLE_LIMITS= 
# src\lib\server\config\index.ts
MAX_SNAPPS_PER_USER= 
# src\lib\server\config\index.ts
PUBLIC_UMAMI_WEBSITE_ID= 
# src\lib\server\config\index.ts
# src\lib\umami.ts
PUBLIC_UMAMI_WEBSITE_URL= 
# src\lib\server\config\index.ts
# src\lib\umami.ts
RPD_REQUESTS= 
# src\lib\server\config\index.ts
RPM_REQUESTS= 
# src\lib\server\config\index.ts
SMTP_FROM= 
# src\lib\server\config\index.ts
SMTP_HOST= 
# src\lib\server\config\index.ts
SMTP_PASS= 
# src\lib\server\config\index.ts
SMTP_PORT= 
# src\lib\server\config\index.ts
SMTP_SSL= 
# src\lib\server\config\index.ts
SMTP_USER= 
# src\lib\server\config\index.ts
# src\lib\server\smtp\index.ts
PUBLIC_URL= 
# src\lib\server\emails\auth\forgotPasswordEmail.svelte
# src\lib\server\emails\auth\resetPasswordEmail.svelte
# src\lib\server\emails\auth\signupEmail.svelte
# src\lib\server\emails\auth\verificationEmail.svelte
# src\lib\server\emails\dbErrorEmail.svelte
# src\lib\server\emails\invitationEmail.svelte
# src\lib\server\emails\smtpTest.svelte
# src\routes\+layout.svelte
PUBLIC_SNAPP_VERSION= 
# src\routes\+page.svelte
DISABLED_EMAIL_AND_PASSWORD= 
# src\routes\auth\sign-in\+page.server.ts, src\routes\auth\sign-up\+page.server.ts
ORIGIN= 
# src\routes\auth\[provider]\+page.server.ts, src\routes\auth\[provider]\callback\+server.ts
PROD= 
# src\routes\auth\[provider]\callback\+server.ts
URLS_VIA_GROUPS_ONLY= 
# src\routes\dashboard\shorten\+page.server.ts
PUBLIC_ADMIN_CONTACT= 
# src\routes\db-error\+page.svelte

# AUTH_PROVIDERS is a list like 
# AUTH_PROVIDERS=GOOGLE,KEYCLOAK,AUTHELIA
AUTH_PROVIDERS= 
# src\lib\server\auth\oidc\config.ts

# AUTH follow AUTH_[PROVIDER]_ENV_NAME so
AUTH_AUTHELIA_CLIENT_ID= 
# src\lib\server\auth\oidc\config.ts
AUTH_AUTHELIA_CLIENT_SECRET= 
# src\lib\server\auth\oidc\config.ts
AUTH_AUTHELIA_ISSUER= 
# src\lib\server\auth\oidc\config.ts

# ---
AUTH_GOOGLE_CLIENT_ID= 
# src\lib\server\auth\oidc\config.ts
AUTH_GOOGLE_CLIENT_SECRET= 
# src\lib\server\auth\oidc\config.ts
AUTH_GOOGLE_ISSUER= 
# src\lib\server\auth\oidc\config.ts

# ---
AUTH_KEYCLOAK_CLIENT_ID= 
# src\lib\server\auth\oidc\config.ts
AUTH_KEYCLOAK_CLIENT_SECRET= 
# src\lib\server\auth\oidc\config.ts
AUTH_KEYCLOAK_CLIENT_SCOPE= 
# src\lib\server\auth\oidc\config.ts
AUTH_KEYCLOAK_ISSUER= 
# src\lib\server\auth\oidc\config.ts
```

## OAUTH2.0 & OIDC

Snapp can now integrate Oauth & OIDC compatible SSO. It requires env variables
prefixed with AUTH as the example above Users are checked on email, unregistered
user will rejected if sign ups are disabled. Registered callback URI at
`/auth/{provider}/callback`

## SMTP Configuration

If you find yourself limited by the UI configuration for your SMTP Server should
be enough to change `smtp.config.cjs` file

```yml
services:
  snapp:
    image: uraniadev/snapp:0.9-rc-021
    ports:
      - 3000:3000
    volumes:
      - ./smtp.config.cjs:/app/smtp.config.cjs
    environment:
      TOKEN_SECRET: # openssh rand --base64 32
```

The file should export a promise that returns a Nodemailer's TransportOptions
type, the original one requires the promise to pick up config from db.

```js
module.exports = async () => ({
	host: 'smtp.example.com',
	port: '587',
	secure: false,
	auth: {
		user: 'username',
		pass: 'password'
	},
  tls:{
    ...
  }
});
```

This could lead to trouble, so test carefully.

## The Stack

The technology involved:

- Svelte Kit
- Zenstack x Prisma
- Lucia Auth
- ShadCN-Svelte x Tailwind CSS
- MaxMind
- Phosphor Icons
- SwaggerUI
- AMCharts
- LayerChart
