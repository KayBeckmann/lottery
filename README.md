# BTC Ticket Verlosungs-App

Willkommen bei der BTC Ticket Verlosungs-App! Dies ist eine Webanwendung, die in Express.js mit Pug als Template-Engine entwickelt wird und es Benutzern ermöglichen soll, Tickets für eine Verlosung mit Bitcoin zu kaufen.

## Projektübersicht

Diese Anwendung dient als Backend und Frontend für eine kleine Online-Verlosung. Benutzer können sich registrieren, anmelden und Tickets kaufen. Sobald alle Tickets verkauft sind, kann ein Gewinner gezogen werden. Die Zahlungsabwicklung mit Bitcoin wird teilweise serverseitig überwacht, während kritische Operationen wie das Bewegen von Geldern für eine lokale Ausführung (z.B. mit einem Python-Skript) vorgesehen sind, um die Sicherheit zu erhöhen.

## Aktuelle & Geplante Funktionen

* **Benutzer-Dashboard:** Anzeige der gekauften Tickets und des Gesamtstatus der Verlosung (Implementiert).
* **Benutzerauthentifizierung:**
    * Registrierung neuer Benutzer (Geplant).
    * Benutzer-Login und -Logout (Geplant).
* **Ticket-System:**
    * Kauf von Tickets (Geplant).
    * Zuweisung eindeutiger Losnummern.
    * Überwachung von Bitcoin-Einzahlungsadressen (Konzept, serverseitige Erkennung).
* **Admin-Panel:**
    * Verwaltung der Verlosungseinstellungen (z.B. Ticketpreis, maximale Anzahl Tickets) (Teilweise konzipiert).
    * Import von Bitcoin-Einzahlungsadressen (Geplant).
    * Starten der Gewinnerziehung (Geplant).
* **Gewinnerziehung:** Zufällige Auswahl eines Gewinners, sobald alle Tickets verkauft sind.
* **Bitcoin-Zahlungen (Konzept):**
    * Generierung/Import von Einzahlungsadressen für Benutzer.
    * Erkennung von Zahlungseingängen.
    * **Hinweis:** Die eigentliche Zusammenführung von Geldern, Gebührenabzug und Gewinnauszahlung ist für ein separates, lokal ausgeführtes Skript vorgesehen (nicht Teil dieses Express.js-Servers), um die Private Keys sicher zu halten.

## Verwendete Technologien

* **Backend:** Node.js, Express.js
* **Frontend (Templating):** Pug
* **Datenbank:** PostgreSQL
* **Authentifizierung:** (Geplant: Passport.js)
* **Umgebungsvariablen:** dotenv

## Setup und Installation

Folge diesen Schritten, um das Projekt lokal einzurichten und auszuführen:

1.  **Voraussetzungen:**
    * Node.js (Version 18.x oder höher empfohlen)
    * npm (wird mit Node.js installiert)
    * PostgreSQL-Datenbankserver

2.  **Repository klonen:**
    ```bash
    git clone [https://github.com/DEIN_BENUTZERNAME/DEIN_REPO_NAME.git](https://www.google.com/search?q=https://github.com/DEIN_BENUTZERNAME/DEIN_REPO_NAME.git)
    cd DEIN_REPO_NAME
    ```

3.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```

4.  **Umgebungsvariablen einrichten:**
    * Erstelle eine Datei namens `.env` im Stammverzeichnis des Projekts.
    * Kopiere den Inhalt von `.env.example` (falls vorhanden) oder füge die folgenden Variablen hinzu und passe sie an deine lokale Umgebung an:

        ```env
        PORT=3000
        DATABASE_URL=postgresql://DEIN_DB_BENUTZER:DEIN_DB_PASSWORT@DEIN_DB_HOST:DEIN_DB_PORT/DEINE_DB_NAME
        # Beispiel für lokale PostgreSQL:
        # DATABASE_URL=postgresql://postgres:passwort@localhost:5432/btc_ticket_db

        # Später für Sessions und Authentifizierung (Beispiel):
        # SESSION_SECRET=deinSuperGeheimesGeheimnis
        ```

5.  **Datenbank initialisieren:**
    * Stelle sicher, dass dein PostgreSQL-Server läuft.
    * Erstelle die notwendige Datenbank (z.B. `btc_ticket_db`), falls noch nicht geschehen.
    * Führe die SQL-Skripte aus, um die Tabellenstruktur und optionale Beispieldaten zu erstellen. Die Skripte findest du in der Dokumentation oder direkt im Code (siehe Abschnitt "Datenbank-Setup" in der bisherigen Anleitung).
        * `users` Tabelle
        * `settings` Tabelle (mit `max_tickets` Eintrag)
        * `tickets` Tabelle
        * Beispieldaten für `users` und `tickets`, um das Dashboard zu testen.

6.  **Anwendung starten:**
    ```bash
    node app.js
    ```
    Oder, falls du ein `start`-Skript in deiner `package.json` definiert hast (z.B. `nodemon app.js` für Entwicklung):
    ```bash
    npm start
    ```

7.  Öffne deinen Browser und navigiere zu `http://localhost:DEIN_PORT` (standardmäßig `http://localhost:3000`).

## Projektstruktur (vereinfacht)
