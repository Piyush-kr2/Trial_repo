# AuraCalc — Modern Glassmorphic Web Calculator

AuraCalc is a sleek, responsive, glassmorphic calculator built with vanilla HTML, modern CSS, and clean JavaScript. It features real-time calculation history, synthesized audio clicks via Web Audio API, quick scientific math functions, theme customization, and full keyboard navigation.

---

## ✨ Features

- 💎 **Glassmorphic UI**: Ambient glowing backgrounds, frosted glass cards (`backdrop-filter`), and refined border lighting.
- 🌓 **Dark / Light Modes**: Instant theme toggle with persistence in `localStorage`.
- 📜 **Calculation History Tape**: Slide-up history drawer recording past calculations with one-click restoration of past results.
- 🔊 **Web Audio Sound Effects**: Realistic soft click synthesis using the browser's native Web Audio API (toggleable on/off).
- 🧮 **Precision Math Engine**: Solves standard floating-point calculation inaccuracies (e.g. `0.1 + 0.2 = 0.3`).
- ⚡ **Quick Math Functions**:
  - Square root ($\sqrt{x}$)
  - Square ($x^2$)
  - Reciprocal ($1/x$)
  - Pi ($\pi$)
  - Percentage ($\%$)
  - Sign inversion ($\pm$)
- 📋 **One-Click Copy**: Copy display values directly to clipboard with visual toast alerts.
- ⌨️ **Full Keyboard Support**: Seamlessly operate using your physical keyboard or numpad.

---

## ⌨️ Keyboard Shortcuts

| Key | Function |
| :--- | :--- |
| `0` - `9` | Digits |
| `.` or `,` | Decimal point |
| `+`, `-`, `*`, `/` | Basic arithmetic operators |
| `Enter` or `=` | Calculate result |
| `Backspace` | Delete last digit |
| `Escape` or `c` | Clear all (AC) |
| `%` | Percentage |

---

## 🚀 Getting Started

### Option 1: Direct Browser
Double-click or open `index.html` directly in any web browser.

### Option 2: Localhost Server (Node.js)
Run the included zero-dependency server:
```bash
npm start
# or
node server.js
```
Then visit:
```
http://localhost:3000/
```

### Option 3: Python Server
```bash
python -m http.server 3000
```

---

## 📂 Project Structure

```
Trial_repo/
├── index.html        # Semantic HTML5 markup & accessible controls
├── style.css         # Glassmorphic styling, CSS variables & animations
├── script.js         # Math engine, Web Audio, history & event listeners
├── server.js         # Zero-dependency local Node.js static HTTP server
├── package.json      # NPM scripts
├── .gitignore        # Ignored files
└── README.md         # Project documentation
```

---

## 📄 License
MIT
