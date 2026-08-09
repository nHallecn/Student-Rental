FROM node:22.13-alpine AS build
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci --workspace=@student-rental/api --workspace=@student-rental/contracts --include-workspace-root=false

COPY apps/api apps/api
COPY packages/contracts packages/contracts
RUN npm run build -w @student-rental/contracts && npm run build -w @student-rental/api
RUN npm prune --omit=dev --workspace=@student-rental/api --workspace=@student-rental/contracts --include-workspace-root=false

FROM node:22.13-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=app:app /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=app:app /app/apps/api/db ./apps/api/db
COPY --from=build --chown=app:app /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build --chown=app:app /app/packages/contracts/dist ./packages/contracts/dist
RUN mkdir -p /app/uploads && chown app:app /app/uploads
USER app
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD wget -qO- http://127.0.0.1:4000/health || exit 1
CMD ["node", "apps/api/dist/server.js"]

