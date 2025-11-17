# Utiliser Node.js comme image de base
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Exposer le port
EXPOSE 4000

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=4000

# Démarrer l'application
CMD ["node", "dist/ui-sedo/server/server.mjs"]