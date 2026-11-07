FROM node:22.23.4-bookworm-slim AS base

WORKDIR /app
COPY package.json package-lock.json ./

FROM base AS development
ENV NODE_ENV=development \
    NUXT_HOST=0.0.0.0 \
    NUXT_PORT=3000 \
    NUXT_TELEMETRY_DISABLED=1
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS build
ENV NUXT_TELEMETRY_DISABLED=1
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.23.4-bookworm-slim AS runtime
ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000 \
    NUXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build --chown=node:node /app/.output ./.output
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=6 CMD ["node", "-e", "fetch('http://127.0.0.1:3000').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", ".output/server/index.mjs"]
