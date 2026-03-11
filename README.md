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
- **Option A (API Key):** 
  - Nutze diese Option, wenn der Hauptordner in den Google-Freigabeeinstellungen auf **"Jeder, der über den Link verfügt, kann ansehen"** gesetzt ist.
  - *Woher bekomme ich den Key?* 
    1. Gehe zur [Google Cloud Console](https://console.cloud.google.com/).
    2. Erstelle ein neues Projekt.
    3. Gehe zu "APIs & Dienste" -> "Bibliothek" und aktiviere die **Google Drive API**.
    4. Gehe zu "APIs & Dienste" -> "Anmeldedaten", klicke auf "Anmeldedaten erstellen" und wähle **"API-Schlüssel"**. 
    5. Kopiere den Schlüssel und setze ihn als `GOOGLE_API_KEY` ein.
- **Option B (Service Account):** Wenn der Ordner privat ist, erstelle einen Service Account in der Google Cloud Console, lade JSON File herunter und setze die darin stehenden Felder `GOOGLE_SERVICE_ACCOUNT_EMAIL` und `GOOGLE_PRIVATE_KEY` in Portainer ein. Wichtig: Du musst den privaten Google Drive Ordner für die Service-Account-Email-Adresse freigeben!

### Google Drive Struktur
- Hauptordner (z.B. "Powerpoint Karaoke") -> ID ist in POWERPOINTS_FOLDER_ID
  - ├── "Startups" (Kategorie-Ordner)
      ├── Pitchdeck.pdf
      ├── Google Slides Präsentation (Direkt in Drive erstellt)
  - ├── "Fun" (Kategorie-Ordner)
      ├── Urlaubsfotos.pdf

Das Backend synchronisiert sich automatisch alle 5 Minuten neu mit dem Drive. Du musst ihn nicht neu starten.

## Lokale Entwicklung
1. In den `backend` Ordner wechseln: `npm run dev` (bzw. `node index.js`)
2. In den `frontend` Ordner wechseln: `npm run dev`
