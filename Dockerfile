FROM node:lts-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .
ENV DATABASE_URL=file:./db.sqlite
RUN npx prisma generate --schema prisma/sqlite/schema.prisma
RUN npx prisma migrate dev -n init --schema prisma/sqlite/schema.prisma
RUN npx prisma migrate deploy --schema prisma/sqlite/schema.prisma
RUN npm run build 

# Copy the entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["entrypoint.sh"]

ENV APPNAME="Snapp.li"
ENV PUBLIC_SNAPP_VERSION="0.8"
# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD node -r dotenv/config build
