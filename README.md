# Snapp

Are you looking for a reliable solution for self-hosted URL shortening? Look no further! Snapp is the perfect tool for individuals and businesses seeking control over their URL management.

## Our Features

- **Intuitive User Interface:** Snapp provides an intuitive user interface for seamless link shortening. Learn how to get started!
- **Secure Authentication:** Enjoy a secure experience with authentication sessions and hashed passwords. Your information is in safe hands.
- **Custom Short Codes:** Create personalized short codes for your links to make them memorable and easy to share.
- **Expiration:** Control the lifespan of your links with expiration dates. Set expiry dates for added security or let them stay active indefinitely.
- **Secret Links:** Add an extra layer of protection with secret links. Choose to share links with a selected audience using unique secrets.
- **Usage Analytics:** Empower yourself with detailed analytics for every link you create. Snapp gathers metrics anonymously, providing insights into link engagements.
- **Extend Metrics:** Integrate your Snapp Instance with your self-hosted or cloud Umami Analytics instance for advanced metrics of your Snapp.
- **Check URL Reputation:** Secure the links passing through your Snapp instance with a check on VirusTotal API reputation.
- **REST API:** Community requested features that enable REST API endpoints to create and manage your Snapps remotely. Read all Swagger Docs [here](https://labs.snapp.li/dashboard/docs).

## Getting Started

Snapp is a self-hostable open-source platform.

### Manual Installation

To run Snapp, you need an environment with NodeJS installed and available.

1. Clone the git repository:
   ```
   git clone https://github.com/urania-dev/snapp.git
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Copy and edit the `.env.example` file:
   ```
   cp .env.example .env && nano .env
   ```
4. Develop and extend Snapp on your server (optional):
   ```
   npm run dev
   ```
5. Build the application:
   ```
   npm run build
   ```
6. Run and enjoy!
   ```
   node -r dotenv/config build
   ```

### Using Docker Container

Simply type in your terminal:

```
docker run -p 3000:3000 uraniadev/snapp:latest
```

If you run into CORS errors, remember to set the `PUBLIC_URL` and `ORIGIN` environment variables:

```
docker run -p 3000:3000 \
-e ORIGIN=https://example.com \
-e PUBLIC_URL=https://example.com \
uraniadev/snapp:latest
```

### Testing 0.7.test version

At the moment the 0.7.test has major changes and need to migrate shortened url with CSV Exporter from old to this version:
Read more and have docker compose in [announcement discussion](https://github.com/urania-dev/snapp/discussions/16).

```yml
version: "3"
services:
  redis-stack:
    image: redis/redis-stack:latest
    ports:
      - 6379:6379/tcp
      - 8001:8001
    volumes:
      - /home/snapp/redis/test:/data:rw
      - /etc/localtime:/etc/localtime:ro
    environment:
      REDIS_ARGS: "--save 60 1 --appendonly yes"
  snapp:
    image: uraniadev/snapp:0.7.test
    ports:
      - 3000:3000
    environment:
      AUTH_SECRET: 
      DB_HOST: 
      DB_PASS:
      DB_PORT: 6379
      DB_IDX: 0
      ENABLE_LIMITS: false
      ENABLE_SIGNUP: true
      ENABLE_HOME: false
      DEFAULT_THEME: dark
      DEFAULT_LANG: en
      LOCALIZATION_FOLDER: /app/translations
      MAX_SHORT_URL: 10
      MAX_USAGES: 0
      MAX_RPM: 0
      MAX_RPD: 0
      VIRUSTOTAL_API_KEY: 
      PUBLIC_URL: https://example.com
      ORIGIN: https://example.com

```

## Migration

The latest versions of Snapp include CSV Export to facilitate migration. Simply log in and import your URLs from the dashboard, and continue from where you left.

## The Stack

The technology involved:

- Svelte Kit
- Redis
- Auth.js
- Skeleton
- MaxMind
- Lucide
