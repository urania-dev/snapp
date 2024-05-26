# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json /app

RUN npm i 

# Copy the source code to the container
COPY . /app

# Build the SvelteKit app
ENV SNAPP_VERSION=0.7.3

ENV AUTH_SECRET=lFNiU7T98/44Qlqb4hMUkVcLOpijEI7z722Kxhv4O2Y=
ENV ALLOW_UNSECURE_HTTP=false
ENV DB_HOST=100.64.0.21
ENV DB_PASS=
ENV DB_PORT=6379
ENV DB_IDX=0
ENV ENABLE_LIMITS=false
ENV ENABLE_SIGNUP=true
ENV ENABLE_HOME=true
ENV DEFAULT_THEME=dark
ENV DEFAULT_LANG=en 
ENV LOCALIZATION_FOLDER=/app/translations
ENV MAX_SHORT_URL=10
ENV PUBLIC_UMAMI_WEBSITE_ID: ${P_UMAMI_WEB_ID} # this allow creator to enable metrics on public https://snapp.li homepage
ENV PUBLIC_UMAMI_URL: ${P_UMAMI_WEBSITE_URL} # this allow creator to enable metrics on public https://snapp.li homepage
ENV MAX_USAGES=0
ENV MAX_RPM=0
ENV MAX_RPD=0
ENV VIRUSTOTAL_API_KEY=
ENV PUBLIC_URL=http://localhost:3000

RUN npm run build 

# Expose the port on which the app will run
EXPOSE 3000

# Set the command to run the app
CMD node -r dotenv/config build

