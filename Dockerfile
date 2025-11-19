# syntax=docker/dockerfile:1

FROM oven/bun:1.2.17 AS base
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock* ./
RUN bun install

COPY prisma/schema ./prisma/schema
COPY prisma/index.ts ./prisma/index.ts
COPY prisma.config.ts ./
COPY tsconfig.json tsdown.config.ts ./
COPY src ./src

RUN bun run db:generate
RUN bun run tailwind:build
RUN bun run build

FROM oven/bun:1.2.17 AS runtime
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/static ./static
COPY --from=base /app/prisma/generated ./prisma/generated
COPY --from=base /app/prisma/index.ts ./prisma/index.ts
COPY package.json bun.lock* ./

CMD ["bun", "dist/index.mjs"]
