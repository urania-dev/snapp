# Snapp

Discover the power of Snapp, your self-hostable URL shortening service. Effortlessly shorten links, and with Snapp's self-hosting capability, you have complete control. Create concise, shareable links on your terms with Snapp's user-friendly platform.

A simple excercise to learn Svelte, Svelte5 Runes, and Tabler.

And to host my urls too.

## Changelog

Since this is a hobby, and i'm still learning, the way of github are obscure to me, so I introduced a change-log,
to see if there has been any change on this project recently.

You can find it [here](https://github.com/urania-dev/snapp/blob/main/CHANGELOG.MD)

## Manual Install / Local Development

You need to have [Node.js](https://nodejs.org) installed on your machine.

- Clone the repository or download the latest zip.
- Download and paste MaxMind `geolite-2-city.mmdb` into `src/lib/server/geo-db/` folder.
- Copy `.example.env` to `.env` and fill it properly.
- Install dependencies: `npm install --legacy-peer-deps`.
- Run for development: `npx prisma db push`.
- Run for development: `npm run dev`.
- Run for production: `npm run build` then `node -r dotenv/config build`.

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

## Multi User

Snapp supports also multi-users, just enable with `ENABLE_MULTIUSER=true`.

The demo will be resetting every 24H. 

### 🖥️ [Link to the demo](https://demo.snapp.li)