FROM node:24-slim AS build

ARG VITE_PEERJS_SERVER_HOST
ARG VITE_PEERJS_SERVER_PORT
ARG VITE_TURN_SERVER_URL

ENV VITE_PEERJS_SERVER_HOST=$VITE_PEERJS_SERVER_HOST
ENV VITE_PEERJS_SERVER_PORT=$VITE_PEERJS_SERVER_PORT
ENV VITE_TURN_SERVER_URL=$VITE_TURN_SERVER_URL

WORKDIR /app

# Install dependencies first so this layer is cached until a manifest changes
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY backend/libs backend/libs
COPY frontend/package.json frontend/
RUN npm ci

COPY . .
RUN npm run build:frontend && npm run build -w backend


FROM node:24-slim AS runtime

ENV NODE_ENV=production

WORKDIR /home/node/app

COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node backend/package.json backend/
COPY --chown=node:node backend/libs backend/libs
COPY --chown=node:node frontend/package.json frontend/
RUN npm ci --omit=dev -w backend && npm cache clean --force

# ServeStaticModule resolves frontend/dist relative to backend/dist/src
COPY --from=build --chown=node:node /app/backend/dist backend/dist
COPY --from=build --chown=node:node /app/frontend/dist frontend/dist

USER node

EXPOSE 4200

# Run node directly so it receives SIGTERM as PID 1
CMD [ "node", "backend/dist/src/main" ]
