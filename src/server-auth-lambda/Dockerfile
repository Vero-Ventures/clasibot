FROM node:20 as builder

RUN apt-get clean && \
    apt-get update && \
    apt-get install -y g++ make cmake unzip libcurl4-openssl-dev

WORKDIR /var/task
COPY package*.json ./
RUN npm install && npm install aws-lambda-ric

RUN --mount=type=bind,source=src,target=/var/task/src \
    npx esbuild \
    --bundle \
    --format=cjs \
    --platform=node \
    --outdir=dist \
    --external:@aws-sdk/* \
    --external:aws-lambda \
    --external:chromium-bidi/* \
    --external:@sparticuz/chromium \
    --external:./xhr-sync-worker.js \
    src/lambda.ts
COPY src ./src


FROM node:20

RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils

WORKDIR /var/task
COPY --from=builder /var/task/dist ./dist
COPY --from=builder /var/task/node_modules ./node_modules
COPY --from=builder /var/task/node_modules/jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js ./dist/xhr-sync-worker.js

ENV HOME=/tmp/.cache
ENV CHROME_PATH="/tmp/.cache/chromium"

ADD https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie /usr/local/bin/aws-lambda-rie
RUN chmod 755 /usr/local/bin/aws-lambda-rie

COPY entrypoint.sh /
RUN chmod 755 /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["dist/lambda.handler"]