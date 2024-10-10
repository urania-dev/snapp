# Snapp

If you're seeking a self-hosted URL shortening solution, Snapp might be what you need. It's designed for those who value control over their URL management and want to explore various technologies.

## A Brief Introduction

This project began as a personal endeavor to explore new technologies and make use of free time. With version 0.7, some development issues emerged, prompting a complete redesign and rebuild. By version 0.8, we've laid the groundwork for what will become the first version 1.

Currently, you can migrate URLs between versions using a CSV export tool. Note that these files are only valid for direct transitions from one version to the next; for example, exports from version 0.6 to 0.7 won't work for moving from 0.7 to 0.8. We’ve reverted to using Prisma to ensure a more stable and maintainable platform going forward.

This latest version supports multiple architectures, including ARM and ARM64 platforms, and offers integration with various databases, now accessible with just a ENV Variable.

## Features

- **Intuitive User Interface:** Snapp offers a user-friendly interface for easy link shortening.
- **Secure Authentication:** Enjoy secure sessions for your user. Their information is protected.
- **Custom Short Codes:** Personalize your short codes to make your links memorable and easy to share.
- **Expiration Dates:** Manage link lifespans with expiration dates. You can set expiry dates for added security or let links remain active indefinitely.
- **Secret Links:** Enhance security with secret links, allowing you to share with a select audience using unique secrets.
- **Usage Analytics:** Access detailed, anonymous analytics for your links. Snapp provides insights into link engagements.
- **Extended Metrics:** Integrate Snapp with your self-hosted or cloud-based Umami Analytics for advanced metrics.
- **URL Reputation Check:** Ensure the safety of links with VirusTotal API reputation checks.
- **REST API:** Community-requested REST API endpoints enable remote management of your Snapp instance. Find all Swagger Docs [here](https://snapp.li/docs).

## Getting Started

Snapp is an open-source platform you can host yourself.

### Testing Version 0.8

For the 0.8 version, you’ll need to migrate URLs using the CSV Exporter. Here’s a sample configuration:

```yml
services:
  snapp:
    image: uraniadev/snapp:latest
    ports:
      - 3000:3000
    environment:
      DATABASE_URL: 'file:./db.sqlite'
      DATABASE_PROVIDER: sqlite # mysql | sqlite | postgres
      TOKEN_SECRET: # openssl rand -base64 32
      ORIGIN: https://example.com
```

**Note**: SQLite database is located in /app/prisma/sqlite/{DATABASE_URL} if you want to mount it

**_Update8.1_**: In order to make it actually work it ended up requiring better specification of schemas for Prisma Clients,
the combinations are:

```yml
DATABASE_PROVIDER: sqlite
DATABASE_URL: file:./db.sqlite
```

```yml
DATABASE_PROVIDER: mysql
DATABASE_MYSQL_URL: mysql://root:password@mariadb:3306/snappdb
```

```yml
DATABASE_PROVIDER: postgres
DATABASE_MYSQL_URL: postgres://root:password@postgres:5432/snappdb
```

## Default Admin Authentication

If ENV variables ADMIN_USERNAME and ADMIN_PASSWORD are not set it defaults to the very secure:

```
  username: admin
  password: password
```

You can always set a SMTP server and use password recovery process to change it later. (not very secure tho...)

## I18N

Snapp at his version 0.8 includes from start Italian, English, German, French, Spanish and Galician. This are very amateurish translation with the help of ChatGPT, so errors are to be expected, feel free to open a related issue if any

## Migration

The latest versions of Snapp include CSV Export to facilitate migration. Simply log in and import your URLs from the dashboard, and continue from where you left.

## ENV Variables

Some configuration moved from envs variable to settings page in-app, thou there are some ENV that could be set as default on first launch:

```
DATABASE_URL= # "file:./db.sqlite"
DATABASE_POSTGRES_URL= # "postgresql://root:password@postgres:5432/snappdb"
DATABASE_MYSQL_URL= # "mysql://root:password@mariadb:3306/snappdb"
DATABASE_PROVIDER= # sqlite | postgres | mysql
TOKEN_SECRET= # openssl rand -base64 32
ORIGIN=https://example.com # to avoid CROSS ORIGIN on Form Submission
ADMIN_USERNAME= # must be specified on first launch as it initiate the database
ADMIN_EMAIL= # must be specified on first launch as it initiate the database
ADMIN_PASSWORD= # must be specified on first launch as it initiate the database
PORT=3000 # app port
PUBLIC_UMAMI_WEBSITE_ID= # uuid
PUBLIC_UMAMI_WEBSITE_URL= # https://umami.example.com/script.js
DISABLE_HOME=false
ENABLE_SIGNUP=false
VTAPI_KEY= # VIRUSTOTAL API KEY
SMTP_HOST= # host smtp.example.com
SMTP_USER= # info@example.com
SMTP_PASS= # account password
SMTP_FROM= # no-reply@example.com
SMTP_PORT= # 465
SMTP_SSL=true# true

```

## SMTP Configuration

If you find yourself limited by the UI configuration for your SMTP Server should be enough to change `smtp.config.cjs` file

```yml
services:
  snapp:
    image: uraniadev/snapp:latest
    ports:
      - 3000:3000
    volumes:
      - ./smtp.config.cjs:/app/smtp.config.cjs
```

The file should export a promise that returns a Nodemailer's TransportOptions type, the original one requires the promise to pick up config from db.

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
- Prisma
- Lucia Auth
- Tailwind CSS
- MaxMind
- Phosphor Icons
- SwaggerUI
- AMCharts
- ChartJS
