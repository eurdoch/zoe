FROM node:18-alpine

# Install PM2
RUN npm install -g pm2

WORKDIR /app
COPY ecosystem.config.js .
WORKDIR /app/api

# Copy package files first for better layer caching
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 3000

# Use PM2 to run the application
CMD ["pm2-runtime", "start", "/app/ecosystem.config.js"]
