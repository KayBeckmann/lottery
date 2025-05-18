# BTC Ticket Verlosungs-App

Willkommen bei der BTC Ticket Verlosungs-App! Dies ist eine Webanwendung, die in Express.js mit Pug als Template-Engine entwickelt wird und es Benutzern ermöglichen soll, Tickets für eine Verlosung mit Bitcoin zu kaufen.

## Projektübersicht

Diese Anwendung dient als Backend und Frontend für eine Online-Verlosung. Benutzer können (zukünftig) sich registrieren, anmelden und Tickets für verschiedene Ziehungen kaufen. Administratoren können Ziehungen erstellen und verwalten. Die Zahlungsabwicklung mit Bitcoin wird konzeptionell unterstützt, wobei Wallet-Adressen User-gebunden sind und Zahlungen über eindeutige Kennungen im Verwendungszweck Tickets zugeordnet werden.

## Aktuelle & Geplante Funktionen

* **Benutzer-Dashboard:**
    * Anzeige gekaufter Tickets pro Ziehung (Implementiert).
    * Anzeige offener Ziehungen (Implementiert).
* **Admin-Panel:**
    * Erstellen, Anzeigen, Bearbeiten von Ziehungen (Ticketpreis, Gebühren, Ticketanzahl) (Implementiert).
    * Verwaltung globaler Einstellungen (Implementiert).
    * Import von Bitcoin-Einzahlungsadressen in einen Pool (Implementiert).
* **Ticket-System:**
    * Kauf von Tickets für spezifische Ziehungen (Konzeptionell beschrieben, Routing teilweise angedeutet).
    * User-gebundene Wallet-Adressen aus einem Pool (Datenbankstruktur und Admin-Import vorhanden).
    * Zahlungsanweisungen mit Ziehungs- und Ticket-UUID zur korrekten Zuordnung (Konzeptionell beschrieben).
    * Handhabung von überverkauften Tickets (Konzeptionell beschrieben).
* **Benutzerauthentifizierung:** (Geplant, derzeit simuliert)
* **Gewinnerziehung:** (Geplant)

## Verwendete Technologien

* **Backend:** Node.js, Express.js
* **Frontend (Templating):** Pug
* **Datenbank:** PostgreSQL
* **Umgebungsvariablen:** dotenv
* **Dateiupload (Admin):** Multer
* **CSV-Verarbeitung (Admin):** csv-parser

## Setup und Installation

Folge diesen Schritten, um das Projekt lokal einzurichten und auszuführen:

1.  **Voraussetzungen:**
    * Node.js (Version 18.x oder höher empfohlen)
    * npm (wird mit Node.js installiert)
    * Docker und Docker Compose (für einfache Datenbank-Einrichtung) ODER ein separater PostgreSQL-Server.

2.  **Repository klonen:**
    ```bash
    git clone [https://github.com/KayBeckmann/lottery.git](https://github.com/KayBeckmann/lottery.git)
    cd lottery
    ```

3.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```

4.  **Umgebungsvariablen einrichten:**
    * Erstelle eine Datei namens `.env` im Stammverzeichnis des Projekts.
    * Passe die Variablen an deine Umgebung an:
        ```env
        PORT=3000
        # Wenn Docker Compose verwendet wird (siehe docker-compose.yml):
        DATABASE_URL=postgresql://postgres:passwort@localhost:5432/btc_ticket_db

        # SESSION_SECRET=deinSuperGeheimesGeheimnis # Für spätere Sessions
        ```

5.  **Datenbank initialisieren (mit Docker Compose):**
    * Stelle sicher, dass Docker Desktop läuft.
    * Führe im Stammverzeichnis des Projekts aus:
        ```bash
        docker-compose up -d
        ```
    * Dies startet einen PostgreSQL-Container und führt die Skripte in `./initdb` (inkl. `init.sql` mit dem neuen Schema) aus.

6.  **Anwendung starten:**
    * Für Entwicklung (mit automatischem Neustart bei Änderungen, `nodemon` muss global oder als devDependency installiert sein):
        ```bash
        npm run dev
        ```
    * Für Produktion:
        ```bash
        npm start
        ```

7.  Öffne deinen Browser und navigiere zu `http://localhost:3000`.

## Wichtige Hinweise zur Implementierung

* **Pug Templates:** Die `.pug`-Dateien für die neuen Admin-Ansichten (`admin_draws_list.pug`, `admin_draw_form.pug`) und die angepasste `dashboard.pug` müssen entsprechend der in den Routen verwendeten `res.render` Aufrufe und übergebenen Daten erstellt werden.
* **Ticketkauf-Route:** Die detaillierte Logik für `/draw/:drawId/buy-tickets` muss implementiert werden, inklusive Wallet-Zuweisung und Generierung der Zahlungsinstruktionen.
* **Zahlungsüberwachung:** Ein separater Prozess oder ein geplanter Task wird benötigt, um Bitcoin-Transaktionen zu überwachen und Tickets als "bezahlt" zu markieren.
* **Flash-Nachrichten:** Für Benutzerfeedback (Erfolg/Fehler) solltest du `connect-flash` und `express-session` (oder eine Alternative) einrichten, wie in den Code-Kommentaren angedeutet.

```json
// kaybeckmann/lottery/lottery-c927e50c24d6c568541f31511194ddae50c67616/.vscode/settings.json
{
    "IDX.aI.enableInlineCompletion": true,
    "IDX.aI.enableCodebaseIndexing": true
}
