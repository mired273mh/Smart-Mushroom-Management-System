FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY web/package.json web/package.json
RUN npm ci --omit=dev --workspace server && npm cache clean --force
COPY --chown=node:node server server
USER node
EXPOSE 3000
CMD ["node", "server/src/index.js"]
