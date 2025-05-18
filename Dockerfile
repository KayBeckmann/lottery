# Basierend auf einem offiziellen Node.js Image
# Wähle eine Version, die zu deiner Entwicklungsversion passt (z.B. v18.x.x)
# node:18-alpine ist eine schlanke Variante
FROM node:18-alpine

# Arbeitsverzeichnis im Container erstellen
WORKDIR /usr/src/app

# package.json und package-lock.json (oder npm-shrinkwrap.json) kopieren
# Dies nutzt den Docker Build Cache, um npm install nur auszuführen, wenn sich diese Dateien ändern
COPY package*.json ./

# Abhängigkeiten installieren
# Für Produktions-Builds ist npm ci oft besser, wenn du eine package-lock.json hast
RUN npm install

# Den Rest des Anwendungscodes in das Arbeitsverzeichnis kopieren
COPY . .

# Den Port exposen, auf dem die App im Container laufen wird (aus .env oder Standard)
# Dieser EXPOSE-Befehl ist mehr eine Dokumentation; die eigentliche Port-Veröffentlichung geschieht in docker-compose.yml
EXPOSE 3000

# Umgebungsvariable für den Port setzen, falls nicht in .env definiert oder um den Standard festzulegen
ENV PORT=3000
ENV NODE_ENV=development 
# Setze auf 'production' für Produktions-Deployments

# Standardbefehl zum Starten der Anwendung
CMD [ "node", "app.js" ]
