# Kahoot Bot Spammer

Spam Kahoot lobbies with bots. CLI + Web App.

## Quick Start

### Windows (PowerShell)
```powershell
git clone https://github.com/ahmad123112/Kahoot-Bot.git; cd Kahoot-Bot; npm install; Write-Host "Done! Run: node kahoot_bot_spammer.js or node server.js"
```

### Linux / macOS
```bash
git clone https://github.com/ahmad123112/Kahoot-Bot.git && cd Kahoot-Bot && npm install && echo "Done! Run: node kahoot_bot_spammer.js or node server.js"
```

---

## Usage

### CLI
```bash
node kahoot_bot_spammer.js
```

Follow the prompts: PIN > bot name > count > mode (0-5)

**In-game commands:**

| Command | Description |
|---------|-------------|
| `mode random` | Random answers |
| `mode fix 0` | Always pick answer #0 |
| `mode fix 1` | Always pick answer #1 |
| `mode fix 2` | Always pick answer #2 |
| `mode fix 3` | Always pick answer #3 |
| `mode none` | No answers (spectate) |
| `round 2` | Override next question all bots pick #2 |
| `status` | Show connected bots + current mode |
| `leave` | All bots leave the game |
| `exit` | Quit |

### Web App
```bash
node server.js
```

Open `http://localhost:3000` in your browser.

## Requirements

- [Node.js](https://nodejs.org/) v18+

## Disclaimer

For educational purposes only. Misuse may violate Kahoot's terms of service.
