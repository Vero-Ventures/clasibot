# This is stage 1 (builder) of the build where we build/compile source code.
FROM node:20 as builder
# running general linux update commands and installing build dependencies
RUN apt-get clean && \
    apt-get update && \
    apt-get install -y g++ make cmake unzip libcurl4-openssl-dev
# cding into the directory we want our built js code in
WORKDIR /var/task
COPY package*.json ./
RUN npm install && npm install aws-lambda-ric
# as mentioned in readme file, had to manually specify config that would usually go in a tsconfig file due to conflict with
# the projects existing tsconfig file.
RUN --mount=type=bind,source=src,target=/var/task/src \
    npx esbuild \
    --bundle \
    --format=cjs \
    --platform=node \
    --outdir=dist \
    --external:@aws-sdk/* \
    --external:aws-lambda \
    --external:chromium-bidi/* \
    # Here we install the special chrome binary built to be run in a lambda environment
    --external:@sparticuz/chromium \
    --external:./xhr-sync-worker.js \
    src/lambda.ts
COPY src ./src

# Now that we built our source code, we start with a fresh image in stage 2.
FROM node:20

# installing chromium related dependencies
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

# here we are copying over only the built files from stage 1, leaving everything else
WORKDIR /var/task
COPY --from=builder /var/task/dist ./dist
COPY --from=builder /var/task/node_modules ./node_modules
COPY --from=builder /var/task/node_modules/jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js ./dist/xhr-sync-worker.js

# remapping HOME directory for lambda OS environment as HOME is read-only in lambda and browsers will
# attempt to write to it, causing function to crash
ENV HOME=/tmp/.cache
ENV CHROME_PATH="/tmp/.cache/chromium"

# adding lambda emulator for local testing and entrypoint script which will detect local/aws environment
# and use the emulator if running locally
ADD https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie /usr/local/bin/aws-lambda-rie
RUN chmod 755 /usr/local/bin/aws-lambda-rie
COPY entrypoint.sh /
RUN chmod 755 /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["dist/lambda.handler"]