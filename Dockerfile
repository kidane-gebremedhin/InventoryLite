# Base image (shared dependencies)
FROM node:24.5.0-alpine AS base
# Create app directory
WORKDIR /app
# Install dependencies
COPY package*.json ./


# Development image
FROM base AS development
RUN npm install
# Copy source code
COPY . .

# Enable hot reload
CMD ["npm", "run", "dev"]

# Build prod application
# RUN npm run build
RUN npm run dev

# Production build stage

FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# Production runtime image (Optimized production image i.e. only 50–80MB)
FROM node:24.5.0-alpine AS production
WORKDIR /app
# Install only prod dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy built Next.js output
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

EXPOSE 3000

# Start the application
CMD ["npm", "start"]

