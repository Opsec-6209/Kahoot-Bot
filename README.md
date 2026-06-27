# Kahoot Bot Spammer

Ein Tool zum Spammen von Kahoot-Lobbys mit Bots. Verfugbar als CLI und als Web-App.

## Features

- **CLI-Version** - Starte Bots direkt uber die Konsole
- **Web-Oberflache** - Grafisches Dashboard im Browser mit Live-Feedback
- **Antwort-Modi:**
  - `none` - Keine Antworten (nur zuschauen)
  - `random` - Zufallige Antworten
  - `fix_0` - `fix_3` - Immer dieselbe Antwort
- **Live-Dashboard** - Bot-Fortschritt, Fragen, Punktestand in Echtzeit
- **Round-Override** - Bestimmte Antwort fur die nachste Frage erzwingen

---

## Installation

```bash
git clone https://github.com/ahmadx9/KahootBotSpammer.git
cd KahootBotSpammer
npm install
```

---

## Nutzung

### CLI (Konsole)

```bash
node kahoot_bot_spammer.js
```

Folge den Prompts:
1. Game-PIN eingeben
2. Bot-Name eingeben
3. Anzahl der Bots
4. Antwort-Modus wahlen (0-5)

#### CLI-Befehle (wahrend des laufenden Spiels)

| Befehl | Beschreibung |
|--------|-------------|
| `mode random` | Zufallige Antworten |
| `mode fix 0` | Immer Antwort #0 |
| `mode fix 1` | Immer Antwort #1 |
| `mode fix 2` | Immer Antwort #2 |
| `mode fix 3` | Immer Antwort #3 |
| `mode none` | Keine Antworten |
| `round 2` | Nachste Frage: Alle Bots antworten #2 |
| `status` | Zeigt verbundene Bots und Modus |
| `leave` | Alle Bots verlassen das Spiel |
| `exit` | Programm beenden |

### Web-App

```bash
node server.js
```

Offne `http://localhost:3000` im Browser.

---

## Voraussetzungen

- [Node.js](https://nodejs.org/) (v18+)

## Abhaengigkeiten

- [kahoot.js-latest](https://www.npmjs.com/package/kahoot.js-latest) - Kahoot-API
- [express](https://www.npmjs.com/package/express) - Web-Server
- [socket.io](https://www.npmjs.com/package/socket.io) - Echtzeit-Kommunikation

---

## Haftungsausschluss

Dieses Projekt dient ausschliesslich Bildungszwecken. Die Nutzung zum Storeen von Kahoot-Spielen kann gegen die Nutzungsbedingungen von Kahoot verstossen. Verwende es verantwortungsvoll.
