<div style="display:flex; align-items:center; gap: 1rem; border-bottom:1px solid rgba(255,255,255,.25); margin-bottom:1rem">
<img src="static/favicon.png" alt="Alt text" style="width:100px; height:auto;" />

<h2 style="border:none"> Snapp – on the road to v1.0 </h2>
</div>

**Snapp** is a self‑hosted URL‑shortening platform with a built‑in dashboard, fine‑grained access control and a REST API. It began as a personal project to explore Svelte technology and has since evolved into a mature service ready for a 1.0 release. This document summarises the project in its current release‑candidate state and lays out what you need to know to prepare for **version 1.0**.

## Why Snapp?

* **Control your links** – host the service yourself, choose your own database, configure optional VirusTotal checks, and decide who can access what.

* **Modern stack** – Snapp is built on Svelte Kit 5, Tailwind CSS and ShadCN‑Svelte for the UI, while the backend uses **Prisma** with the **ZenStack** policy engine for column‑level security. Authentication is managed by **Lucia Auth** with JWTs.

* **Easy to extend** – a clear REST API and an internal policy layer make it simple to integrate Snapp into your existing services.

## Feature overview

Snapp already includes many features you would expect from a mature URL shortener. Version 0.9 adds new capabilities and version 1.0 will polish them further.

* **User‑friendly interface** – intuitive dashboard for shortening and managing links[\[1\]](https://github.com/urania-dev/snapp/blob/0.9-rc/README.md#L36-L51).

* **Authentication & authorisation** – secure sessions and role‑based access control; administrators and “root” users can manage other users[\[2\]](https://github.com/urania-dev/snapp/blob/0.9-rc/POLICIES.md#L20-L85).

* **Custom codes & expiration** – choose your own shortcodes and set optional expiry dates[\[3\]](https://github.com/urania-dev/snapp/blob/0.9-rc/README.md#L42-L45).

* **Secrets** – protect private links with secret tokens[\[4\]](https://github.com/urania-dev/snapp/blob/0.9-rc/README.md#L46-L48).

* **Analytics & usage** – Snapp logs every click, capturing browser/device information and geolocation, and writes it to a Usage table. Anonymous metrics can also be sent to **Umami** for advanced dashboards[\[5\]](https://github.com/urania-dev/snapp/blob/0.9-rc/src/lib/umami.ts#L24-L79).

* **Extended metrics** – optional UTM parameters are appended before sending events to Umami[\[6\]](https://github.com/urania-dev/snapp/blob/0.9-rc/src/lib/umami.ts#L81-L103).

* **Tags & groups** – users can organise snapps with multiple tags. When `TAGS_AS_PREFIX` is enabled, tags become URL prefixes (e.g. `example.com/blog/abc`)[\[7\]](https://github.com/urania-dev/snapp/blob/0.9-rc/CHANGELOG.md#L165-L173). Snapp 0.9 converts “tags” into **groups** to allow membership‑based access (one group per user or shared across users)[\[8\]](https://github.com/urania-dev/snapp/blob/0.9-rc/CHANGELOG.md#L228-L232).

* **Multi‑Factor Authentication (MFA)** – time‑based one‑time passwords (TOTP) can be enabled from the UI or via the `ENABLED_MFA` environment variable[\[9\]](https://github.com/urania-dev/snapp/blob/0.9-rc/CHANGELOG.md#L174-L176). Recent releases added a failsafe when a QR code is missed, prompting a new token[\[10\]](https://github.com/urania-dev/snapp/blob/0.9-rc/CHANGELOG.md#L212-L215).

* **OIDC/OAuth 2.0 support** – integrate with external identity providers such as Google, Keycloak or Authelia. Providers are configured through `AUTH_PROVIDERS` and related `AUTH_*` variables. Generic OIDC support was added in 0.8.7.3[\[11\]](https://github.com/urania-dev/snapp/blob/0.9-rc/CHANGELOG.md#L180-L187).

* **Watchlists & safety checks** – Snapp validates every original URL before creating a short link. It checks that HTTPS is used, verifies against custom allow/deny lists and queries the VirusTotal API for reputation[\[12\]](https://github.com/urania-dev/snapp/blob/0.9-rc/src/lib/server/watchlists/index.ts#L204-L218). Domains are cached and re‑checked regularly to avoid API overuse[\[13\]](https://github.com/urania-dev/snapp/blob/0.9-rc/src/lib/server/watchlists/index.ts#L221-L250).

* **Rate‑limiting** – requests per minute and per day can be limited through `RPM_REQUESTS` and `RPD_REQUESTS` variables. When enabled, Snapp tracks per‑user quotas and returns an error when exceeded.

* **Import/export** – CSV import/export tools allow migrating links between versions; the exporter writes the current schema and the importer guides you through mapping columns.

* **REST API** – a comprehensive REST interface powered by ZenStack policies allows programmatic management of snapps, users and groups[\[14\]](https://github.com/urania-dev/snapp/blob/0.9-rc/README.md#L52-L55). Documentation is published via Scalar at `/docs`.

* **Internationalisation** – translations for Italian, English, German, French, Spanish, Galician and Chinese are included; more can be added via community contributions[\[15\]](https://github.com/urania-dev/snapp/blob/0.9-rc/CHANGELOG.md#L152-L153).

## Technology stack

| Area | Implementation |
| :---- | :---- |
| Front‑end | Svelte Kit 5, Tailwind CSS, ShadCN‑Svelte |
| State management | Svelte stores |
| Authentication | Lucia Auth (JWT), optional OIDC/OAuth integration |
| Database | Prisma ORM with adapters for SQLite, MySQL & Postgres[\[16\]](https://github.com/urania-dev/snapp/blob/0.9-rc/CHANGELOG.md#L109-L116) |
| Policy engine | ZenStack (fine‑grained, column‑level access control)[\[8\]](https://github.com/urania-dev/snapp/blob/0.9-rc/CHANGELOG.md#L228-L232) |
| Metrics & analytics | Custom usage log \+ optional Umami integration |
| Mailer | Nodemailer via configurable SMTP |
| Container images | Multi‑arch (`x86_64`, arm, arm64) Docker images |

## Getting started

### Quick start with Docker

Create a file called docker-compose.yml and paste the following service definition. Replace the environment values with your own secrets.

```
version: "3"  
services:  
  snapp:  
    image: uraniadev/snapp:0.9-rc-020 # will become uraniadev/snapp:1.0 when v1 is released  
    ports:  
      - "3000:3000"  
    environment:  
      DATABASE_PROVIDER: sqlite         # sqlite | postgres | mysql  
      DATABASE_URL: "file:./db.sqlite"  # or connection string for postgres/mysql  
      TOKEN_SECRET: "$(openssl rand \-base64 32)"  
      ORIGIN: "https://example.com"  
      ADMIN_USERNAME: admin             # set your own admin credentials  
      ADMIN_PASSWORD: strongpassword    # environment default is admin/password 
      ENABLE_SIGNUP: true               # allow public sign‑ups  
      ENABLED_MFA: true                 # enable multi‑factor auth
```

The SQLite database is stored inside the container at `/app/dbschema/sqlite/prisma/db.sqlite`. You can mount that file to persist data across restarts[\[19\]](https://github.com/urania-dev/snapp/blob/0.9-rc/README.md#L79-L81). To use MySQL or Postgres, set `DATABASE_PROVIDER` accordingly and supply a connection string, as shown in the sample configuration[\[17\]](https://github.com/urania-dev/snapp/blob/0.9-rc/README.md#L88-L93).

### Node/Bun environment

Snapp uses Bun during development and Node.js for deployment. Clone the repository, install dependencies with bun install or pnpm install, then run bun run dev. When deploying to production you should run bun run build and bun start or use the provided Dockerfile.

## Environment variables

Snapp relies on environment variables for configuration. Some settings can be modified through the web interface, but critical options must be set at start‑up. The configuration module enforces that the following variables are defined[\[20\]](https://github.com/urania-dev/snapp/blob/0.9-rc/src/lib/server/config/index.ts#L42-L54):

| Variable | Purpose (concise) |
| :---- | :---- |
| `HOST` | host binding for the HTTP server |
| `PORT` | port number (defaults to 3000\) |
| `ORIGIN` | public URL of your instance |
| `DATABASE_PROVIDER` | one of sqlite, postgres, mysql |
| `DATABASE_URL` | connection string or SQLite path |
| `TOKEN_SECRET` | random secret for JWT signing |
| `ADMIN_USERNAME` | initial administrator username |
| `ADMIN_EMAIL` | initial administrator e‑mail address |
| `ADMIN_PASSWORD` | initial administrator password |
| `ENABLE_SIGNUP` | allow self‑registration of users |
| `ENABLED_MFA` | enable TOTP MFA globally |

Additional optional variables control advanced behaviour[\[21\]](https://github.com/urania-dev/snapp/blob/0.9-rc/src/lib/server/config/index.ts#L127-L147):

| Variable | Description (concise) |
| :---- | :---- |
| `ALLOW_UNSECURE_HTTP` | allow shortening of non‑HTTPS URLs |
| `APPNAME` | custom application name |
| `ENABLE_LIMITS` | enable per‑user snapp limits |
| `MAX_SNAPPS_PER_USER` | default number of snapps per user |
| `PUBLIC_UMAMI_WEBSITE_ID` | site ID for Umami analytics |
| `PUBLIC_UMAMI_WEBSITE_URL` | base URL for Umami server |
| `RPD_REQUESTS` | requests‑per‑day limit |
| `RPM_REQUESTS` | requests‑per‑minute limit |
| `SMTP_HOST/PORT/USER/PASS` | SMTP server configuration for outgoing e‑mails |
| `SMTP_FROM` | default “from” address for e‑mails |
| `DISABLED_EMAIL_AND_PASSWORD` | disable e‑mail/password signup when using OIDC |
| `URLS_VIA_GROUPS_ONLY` | require that all snapps are assigned to a group |
| `AUTH_PROVIDERS` | comma‑separated list of OIDC providers (e.g. GOOGLE,KEYCLOAK) |
| `AUTH_<PROVIDER>_*` | client ID, secret, issuer etc. for each OIDC provider |
| `VTAPI_KEY` | VirusTotal API key for domain reputation checks |

For a complete list, refer to the .env.example file in the repository[\[22\]](https://github.com/urania-dev/snapp/blob/0.9-rc/.env.example#L1-L29).

## Database and policies

Snapp uses **Prisma** for data access and **ZenStack** to enforce row‑ and column‑level security. Policies are defined in POLICIES.md and compiled into the Prisma schema. For example, ordinary users can read and modify only their own data, while administrators and root users have full access[\[2\]](https://github.com/urania-dev/snapp/blob/0.9-rc/POLICIES.md#L20-L85). The Snapp model allows anyone to read public snapps but enforces ownership and group membership for modifications[\[23\]](https://github.com/urania-dev/snapp/blob/0.9-rc/POLICIES.md#L76-L86). These policies also govern the REST API, so your custom integrations automatically follow the same access rules[\[24\]](https://github.com/urania-dev/snapp/blob/0.9-rc/POLICIES.md#L138-L140).

When upgrading to v1.0 you must initialise a new database. Use the export tool from your current version to generate a CSV of existing links and then import it into v1.0. Because schema changes are significant, direct migrations are not supported across major versions.

## URL validation & watchlists

To protect both you and your users, Snapp validates the destination URL before shortening it. Validation consists of several steps:

1. **HTTPS enforcement** – if `ALLOW_UNSECURE_HTTP` is not set, only HTTPS links are accepted[\[25\]](https://github.com/urania-dev/snapp/blob/0.9-rc/src/lib/server/watchlists/index.ts#L206-L215).

2. **Allow/deny lists** – domains, e‑mail domains and usernames can be whitelisted or blacklisted via the admin UI or the API. Whitelisted domains bypass other checks; blacklisted domains cause the snapp to be disabled[\[12\]](https://github.com/urania-dev/snapp/blob/0.9-rc/src/lib/server/watchlists/index.ts#L204-L218).

3. **VirusTotal reputation** – when you provide a `VTAPI_KEY`, Snapp submits the domain to VirusTotal. The result is cached and rechecked periodically; only domains with more harmless votes than malicious votes are allowed[\[13\]](https://github.com/urania-dev/snapp/blob/0.9-rc/src/lib/server/watchlists/index.ts#L221-L250).

4. **Rate limits** – per‑user quotas ensure that spammy users cannot create unlimited snapps.

These checks also run when a user visits a snapp. If a previously good domain becomes malicious, the snapp is automatically disabled and visits return an error.

## REST API

Snapp’s API mirrors the functionality of the UI. It is documented using Swagger/Scalar and available at /docs once your server is running. The API supports operations such as:

* Creating, updating and deleting snapps

* Managing tags/groups

* Querying usage statistics

* Managing users, invitations and roles

* Retrieving and modifying settings

API requests require an authentication token, which users can generate in the settings page. Rate‑limits apply to API requests as well.

## Internationalisation

Snapp supports multiple languages out of the box and falls back to English if a translation is missing. To add or improve translations, edit files under src/lib/i18n and submit a pull request.

## Contributing and roadmap

Contributions are welcome\! Please check the open issues and discussions for tasks that need help.

Snapp is released under the MIT licence. See LICENSE.md for details.

## Acknowledgements

This project would not have been possible without the Svelte and Prisma communities. Special thanks to all contributors who reported issues, suggested features and provided translations.


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