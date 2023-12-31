# Snapp

Discover the power of Snapp, your self-hostable URL shortening service. Effortlessly shorten links, and with Snapp's self-hosting capability, you have complete control. Create concise, shareable links on your terms with Snapp's user-friendly platform.

A simple excercise to learn Svelte, Svelte5 Runes, and Tabler.

And to host my urls too.

## Changelog

Since this is a hobby, and i'm still learning, the way of github are obscure to me, so I introduced a change-log,
to see if there has been any change on this project recently.

You can find it [here](https://github.com/urania-dev/snapp/blob/main/CHANGELOG.md)

## Manual Install / Local Development

You need to have [Node.js](https://nodejs.org) installed on your machine.

- Clone the repository or download the latest zip.
- Download and paste MaxMind `geolite-2-city.mmdb` into `src/lib/server/geo-db/` folder.
- Copy `.example.env` to `.env` and fill it properly.
- Install dependencies: `npm install --legacy-peer-deps`.
- Run for development: `npx prisma db push`.
- Run for development: `npm run dev`.
- Run for production: `npm run build` then `node -r dotenv/config build`.

## Admin credentials

By default the app will not create any admin user, you should setup your own by signin up on the front-end.
First user registered get marked as Admin.

Also you can set up variables to create admin if not already existing by the same username at platform launch.

- `ADMIN_USERNAME=admin`
- `ADMIN_EMAIL=admin@snapp.li`
- `ADMIN_PASSWORD=password`

## SMTP Transporter 
Here a resend / generic example of using the SMTP for password recovery. It will check username and mail inserted to be correct before sending.

- `SMTP_HOST=smtp.resend.com`
- `SMTP_USER=resend`
- `SMTP_PASSWORD={RESEND_API_KEY HERE}`
- `SMTP_FROM="No Reply <noreply@{RESEND VERIFIED DNS HERE}.com>"`

## Docker Install

```bash
docker run -p 3000:3000 uraniadev/snapp:latest
```

If your run into CORS problem be sure to set ORIGIN and PUBLIC_URL

```bash
docker run \
-e ORIGIN=https://example.com \
-e PUBLIC_URL=https://example.com \
-p 3000:3000 \
uraniadev/snapp:latest
```

CORS and non HTTPS Instances

Snapp uses Lucia Auth, and requires to be hosted behind a Secure HTTPS Protocol.

If self-hosting without a Secure HTTPS Protocol, set `NODE_ENV=development` to allow Lucia handle sessions.

Let's say for example that you want to host Snapp on an old salvaged homelab with hostname: `refurbished` on port `8000`

```bash
docker run \
-p 8000:3000 \
-e ORIGIN=http://refurbished:8000 \
-e PUBLIC_URL=http://refurbished:8000 \
-e NODE_ENV=development \
uraniadev/snapp:latest
```

## Docker-Compose
```yaml
version: "3"
services: 
 snapp:
    restart: always
    container_name: snapp
    image: "uraniadev/snapp:latest"
    volumes:
      - /docker/snapp/db.sqlite:/app/prisma/db.sqlite
    ports:
      - "3000:3000"
    environment:
      PUBLIC_URL: https://example.com
      ORIGIN: https://example.com
      SMTP_HOST: mail.example.com
      SMTP_USER: snapp@example.com
      SMTP_PASSWORD: SuperSecurePassword
      SMTP_FROM: snapp@example.com
      UMAMI_URL: https://umami.example.com
      WEBSITE_ID: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
      ENABLE_MULTIUSER: false
      DISABLE_HOME: true
```

## API REST Interface

Built-in Api endpoints and OpenApi Documentation via Redoc-Static at [/openapi.html](http://snapp.li/openapi.html)

## Umami Integrations

Yeah my metrics are cool, and integrated, but if you want to have more control, and leverage the power of a real metrics Analytics provider, you can pass

`UMAMI_URL` set to your [Umami](https://umami.js) instance or cloud.

`WEBSITE_ID` provided by Umami.

And that should also works in the snapp server-side redirect, as i set a script to send a `/api/post` request with a payload filled at my best

## Multi User

Snapp supports also multi-users, just enable with `ENABLE_MULTIUSER=true`.

The demo will be resetting every 24H.

### 🖥️ [Link to the demo](https://demo.snapp.li)

## DISCLAIMER

The public instance of [https://snapp.li](https://snapp.li) and [https://demo.snapp.li](https://demo.snapp.li) track anonymous analytics with umami.is.
