# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json /app

# Install dependencies
COPY ./prisma/schema.prisma ./prisma/schema.prisma
ENV DATABASE_URL="file:./db.sqlite"

RUN touch /app/prisma/db.sqlite
RUN npm i --legacy-peer-deps

# Copy the source code to the container
COPY . /app

# Build the SvelteKit app
ENV TIMEZONE=Europe/Rome
ENV ENABLE_MULTIUSER=false
ENV PORT=3000
ENV PUBLIC_URL=http://localhost:3000
ENV ORIGIN=${PUBLIC_URL}
ENV NODE_ENV=production
ENV DEMO=false
ENV DISABLE_HOME=false
ENV METRIC_RETENTION_DAYS=30

RUN npm run build 
# Expose the port on which the app will run
EXPOSE 3000

# Set the command to run the app
CMD node -r dotenv/config build
