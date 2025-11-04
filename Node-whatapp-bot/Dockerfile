# node-whatsapp/Dockerfile
FROM node:18-bullseye

# Install dependencies for Chrome / Puppeteer
RUN apt-get update && apt-get install -y \
  wget gnupg ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 \
  libcups2 libxss1 libxtst6 xdg-utils libdbus-1-3 libgbm1 libgtk-3-0 --no-install-recommends

# Install Chrome (required by WPPConnect)
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
 && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
 && apt-get update && apt-get install -y google-chrome-stable \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Node dependencies
COPY package*.json ./
RUN npm install --production      # ✅ FIXED (replaces npm ci)

# Copy the rest of your app
COPY . .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
