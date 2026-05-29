FROM node:20-slim
WORKDIR /app

COPY site_2/package*.json site_2/
COPY site_2/scripts site_2/scripts
COPY api/package*.json api/
COPY reference reference/

RUN cd site_2 && npm ci && npm run generate:model
RUN cd api && npm ci

COPY site_2 site_2
COPY api api

ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080

WORKDIR /app/api
CMD ["npm", "run", "start"]
