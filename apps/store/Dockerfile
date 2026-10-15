# Builds the store app and serves it with nginx.
# Build from the repository root, because the app needs bun.lock and packages/api:
#   docker build -f apps/store/Dockerfile .
FROM oven/bun:1.2.21 AS build
WORKDIR /repo
# Workspace manifests first, so the install layer stays cached until dependencies change.
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/store/package.json apps/store/
COPY apps/mobile/package.json apps/mobile/
COPY apps/desktop/package.json apps/desktop/
COPY apps/marketing/package.json apps/marketing/
COPY apps/docs/package.json apps/docs/
COPY apps/support/package.json apps/support/
COPY packages/api/package.json packages/api/
# Install only this app's dependencies, not Expo or Electron.
RUN bun install --frozen-lockfile --filter ./apps/store
COPY . .
RUN bun run --cwd apps/store build

FROM nginx:1.29-alpine
COPY apps/store/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/store/dist /usr/share/nginx/html
