# Stage 1: Installer les dépendances et compiler les modules natifs (sqlite3)
FROM node:20-slim AS builder

WORKDIR /app

# Installation des outils système requis pour compiler les dépendances C/C++ (sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Installation complète des dépendances
RUN npm install

# Stage 2: Conteneur de production minimal
FROM node:20-slim

WORKDIR /app

# Copie des fichiers compilés de node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Définition des variables d'environnement de production
ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

# Démarrage de l'application
CMD ["node", "server.js"]
