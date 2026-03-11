# PowerPoint Karaoke (Kapopo Clone)

Ein lokaler Kapopo Klon, der Präsentationen as einem definierten Google Drive Ordner zieht und Multi-Device Controller Support (bis zu 15 Spieler) über lokales Netzwerk bietet.

## Deployment auf Portainer mit GitHub

1. Pushe diesen Code in dein GitHub Repository.
2. Die bereitgestellte GitHub Action (`.github/workflows/docker-publish.yml`) wird automatisch ein Docker Image bauen und in die **GitHub Container Registry (GHCR)** pushen.
3. In **Portainer**, erstelle einen neuen Stack und füge die bereitgestellte `docker-compose.yml` ein. Vergiss nicht das `image` Feld mit deiner echten GHCR Url (`ghcr.io/dein-name/rep-name:latest`) auszutauschen.
4. Setze die Environment-Variablen im Portainer Stack:

### Umgebungsvariablen Setup
Damit das Backend die Kategorien (Ordner) und Präsentationen (PDFs, Google Slides) laden kann:

- **POWERPOINTS_FOLDER_ID:** Die ID deines Google Drive Hauptordners.
  - *Wo finde ich das?* Öffne deinen Google Drive Ordner im Browser. Wenn die URL z.B. `https://drive.google.com/drive/folders/1aBcDeFgH-2iJ_kLmNoP12345` ist, dann ist `1aBcDeFgH-2iJ_kLmNoP12345` deine ID.

**Zugriff (Zwei Optionen):**

**Option A (API Key - Einfachster Weg für öffentliche Ordner):**
Wenn dein Google Drive Hauptordner in den Freigabeeinstellungen auf **"Jeder, der über den Link verfügt, kann ansehen"** gesetzt ist, reicht dein API Key völlig aus!
- Trage deinen erstellten Schlüssel in Portainer als Environment Variable `GOOGLE_API_KEY` ein.
- Du kannst die Variablen `GOOGLE_SERVICE_ACCOUNT_EMAIL` und `GOOGLE_PRIVATE_KEY` dann leer lassen.

**Option B (Service Account - Für private Ordner):**
Nur notwendig, wenn dein Ordner privat ist und bleiben soll:
1. Gehe in der Google Cloud Console auf "IAM & Verwaltung" -> "Dienstkonten".
2. Erstelle ein Dienstkonto (z.B. `kapopo-backend`).
3. Kopiere die E-Mail-Adresse des Dienstkontos und füge sie in deinem Google Drive Ordner als "Betrachter" hinzu!
4. Gehe im Dienstkonto auf "Schlüssel" -> "Neuen Schlüssel erstellen" -> JSON.
5. Kopiere den Wert `"client_email"` in Portainer (`GOOGLE_SERVICE_ACCOUNT_EMAIL`).
6. Kopiere den EXAKTEN, kompletten `"private_key"` (inklusive `-----BEGIN PRIVATE KEY-----` und `\n`) in Portainer (`GOOGLE_PRIVATE_KEY`).

### Google Drive Struktur
- Hauptordner (z.B. "Powerpoint Karaoke") -> ID ist in POWERPOINTS_FOLDER_ID
  - ├── "Startups" (Kategorie-Ordner)
      ├── Pitchdeck.pdf
      ├── Google Slides Präsentation (Direkt in Drive erstellt)
  - ├── "Fun" (Kategorie-Ordner)
      ├── Urlaubsfotos.pdf

Das Backend synchronisiert sich automatisch alle 5 Minuten neu mit dem Drive. Du musst ihn nicht neu starten.

## Lokale Entwicklung
1. In den `backend` Ordner wechseln: `npm run dev`
2. In den `frontend` Ordner wechseln: `npm run dev`
