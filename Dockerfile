FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server
CMD ["pnpm", "dev", "--host"]
