# Builds the web app and serves it with nginx.
# Build from the repository root, because the app needs bun.lock and packages/api:
#   docker build -f apps/web/Dockerfile .
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
RUN bun install --frozen-lockfile --filter ./apps/web
COPY . .
RUN bun run --cwd apps/web build

FROM nginx:1.29-alpine
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
