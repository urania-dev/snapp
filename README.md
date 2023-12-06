## Snapp

### Url Shortner

Discover the power of Snapp, your self-hostable URL shortening service. Effortlessly shorten links, and with Snapp's self-hosting capability, you have complete control. Create concise, shareable links on your terms with Snapp's user-friendly platform.

A simple excercise to learn Svelte, Svelte5 Runes, and Tabler.

And to host my urls too.

### Manual Install / Local Development

You need to have [Node.js](https://nodejs.org) installed on your machine.

- Clone the repository or download the latest zip.
- Download and paste MaxMind `geolite-2-city.mmdb` into `src/lib/server/geo-db/` folder.
- Copy `.example.env` to `.env` and fill it properly.
- Install dependencies: `npm install --legacy-peer-deps`.
- Run for development: `npx prisma db push`.
- Run for development: `npm run dev`.
- Run for production: `npm run build` then `node -r dotenv/config build`.

### Docker Install

```bash
docker run -p 3000:3000 uraniadev/snapp:latest
```
