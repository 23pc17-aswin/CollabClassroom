# Use Bullseye (Debian) instead of Alpine
FROM node:20-bullseye

# Install OpenSSL 1.1 explicitly for Debian
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate prisma client
RUN npx prisma generate

EXPOSE 8000

CMD ["npm", "run", "dev"]