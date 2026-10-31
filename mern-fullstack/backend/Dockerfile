FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
USER node
ENV NODE_ENV=production
EXPOSE 8000
CMD ["node", "src/server.js"]
