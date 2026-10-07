FROM node:22-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
COPY . .
# Non-secrets: visible in the page's HTML source to every visitor anyway.
# Baked in at build time because env_file only injects vars at container
# runtime, after Next.js has already prerendered pages with them unset.
ARG UMAMI_URL
ARG UMAMI_WEBSITE_ID
ENV UMAMI_URL=${UMAMI_URL}
ENV UMAMI_WEBSITE_ID=${UMAMI_WEBSITE_ID}
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "run", "start"]
