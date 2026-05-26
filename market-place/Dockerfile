# Stage 1: Construction de l'application React
FROM node:20-slim AS build

WORKDIR /app

# Déclaration des arguments de build pour les injecter dans Vite
ARG VITE_API_URL
ARG VITE_ML_API_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ML_API_URL=$VITE_ML_API_URL

# Copie des fichiers package.json et lock
COPY package*.json ./

# Installation des dépendances
RUN npm ci

# Copie du reste des sources
COPY . .

# Build de production
RUN npm run build

# Stage 2: Serveur Nginx de production
FROM nginx:alpine

# Copie des fichiers buildés depuis l'étape précédente
COPY --from=build /app/dist /usr/share/nginx/html

# Remplacement de la configuration Nginx par défaut
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
