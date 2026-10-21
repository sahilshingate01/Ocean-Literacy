<div align="center">

# 🌊 Ocean Literacy Desktop

**An Interactive Marine Science & Exploration Desktop Application**  
*Dedicated to the United Nations Decade of Ocean Science for Sustainable Development (2021–2030)*

[![CI Status](https://github.com/sahilshingate01/Ocean-Literacy/actions/workflows/verify-test.yml/badge.svg)](https://github.com/sahilshingate01/Ocean-Literacy/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-v33.2.1-47848F.svg)](https://www.electronjs.org/)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)]()

</div>

---

## 📖 Overview

**Ocean Literacy** is an open-source, production-grade desktop application engineered to cultivate deep ocean awareness, planetary marine science comprehension, and active conservation stewardship.

Built upon the official scientific framework established by the **UNESCO Intergovernmental Oceanographic Commission (IOC)** and the **Ocean Literacy Network**, this application translates complex oceanographic data into rich, intuitive visual experiences.

---

## ✨ Exploration Modules

| Module | Description | Core Capabilities |
| :--- | :--- | :--- |
| **🌊 7 Ocean Principles** | The fundamental UNESCO scientific framework | Interactive cards, case studies (The Great Ocean Conveyor, Deep Hydrothermal Oasis), core tenets. |
| **⚓ Depth Zones Simulator** | Bathymetric vertical water column explorer | Submersible dive simulator from surface (0m) to Challenger Deep (11,000m) with real-time pressure, temperature, and light telemetry. |
| **🐋 Marine Life Encyclopedia** | Taxonomy & evolutionary adaptations | Specimen dossiers across all marine phyla, IUCN Red List status badges, and food web connections. |
| **🌀 Climate & Currents** | Thermodynamic heat & carbon engine | Interactive ocean acidification model (pH vs CO₂ ppm), aragonite saturation gauge, and major ocean current maps. |
| **🛡️ Conservation Tracker** | Anthropogenic threats & 30x30 target | Plastic pollution monitor, overfishing metrics, marine heatwaves, and interactive personal steward pledge checklist. |
| **🎓 Steward Assessment** | Certification & Knowledge Evaluation | 10-question comprehensive assessment with automatic rendering of an exportable High-Resolution Certificate of Ocean Stewardship. |

---

## 🏗️ Desktop Architecture

```
Ocean-Literacy/
├── assets/                     # Desktop branding & media
│   └── icons/                  # 512x512 app icon, 32x32 tray icon, SVG vector master
├── build/                      # Electron packaging configurations
│   ├── entitlements.mac.plist  # macOS hardened runtime entitlements
│   └── installer.nsh           # Windows custom NSIS installer script
├── scripts/                    # Automated build & installation scripts
│   ├── install.sh              # Unix/macOS one-click setup script
│   ├── install.bat             # Windows setup script
│   ├── generate-icons.js       # Zero-dependency PNG generator
│   ├── build-desktop.js        # Cross-platform compilation tool
│   └── verify-setup.js         # Integrity checker
├── src/
│   ├── main/
│   │   └── main.js             # Electron main process, lifecycle, window, tray, native menu
│   ├── preload/
│   │   └── preload.js          # Secure contextBridge IPC bridge
│   └── renderer/               # Renderer UI (Vanilla CSS + JS modules)
│       ├── index.html          # Semantic desktop shell
│       ├── styles/             # Curated bioluminescent dark mode design system
│       └── js/                 # Modular controllers, datasets, and Web Audio synthesizer
├── test/
│   └── app.test.js             # Automated unit & schema verification test suite
└── .github/workflows/          # Multi-platform CI/CD release pipelines
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org) (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 1. Clone & Setup
```bash
git clone git@github.com:sahilshingate01/Ocean-Literacy.git
cd Ocean-Literacy
```

### 2. Automated Install & Sanity Check
On macOS or Linux:
```bash
./scripts/install.sh
```
On Windows:
```cmd
scripts\install.bat
```

### 3. Launch in Development Mode
```bash
npm install
npm start
```

---

## 📦 Building Standalone Desktop Installers

To package native desktop installers for your operating system:

| Platform | Target Artifacts | Command |
| :--- | :--- | :--- |
| **macOS** | `.dmg` installer & `.zip` bundle (Apple Silicon + Intel) | `npm run dist:mac` |
| **Windows** | `.exe` NSIS installer & portable executable | `npm run dist:win` |
| **Linux** | `.AppImage` & `.deb` package | `npm run dist:linux` |
| **Directory** | Unpacked application bundle for local testing | `npm run pack` |

All compiled distribution binaries are written to the `dist/` directory.

---

## ⌨️ Desktop Shortcuts

- <kbd>⌘</kbd> + <kbd>1</kbd> — Open 7 Ocean Principles
- <kbd>⌘</kbd> + <kbd>2</kbd> — Open Depth Zones Simulator
- <kbd>⌘</kbd> + <kbd>3</kbd> — Open Marine Encyclopedia
- <kbd>⌘</kbd> + <kbd>4</kbd> — Open Climate & Currents
- <kbd>⌘</kbd> + <kbd>5</kbd> — Open Conservation Tracker
- <kbd>⌘</kbd> + <kbd>6</kbd> — Open Knowledge Assessment & Cert
- <kbd>⌘</kbd> + <kbd>K</kbd> — Global Quick Search
- <kbd>Esc</kbd> — Close modals and drawers

*(Replace <kbd>⌘</kbd> with <kbd>Ctrl</kbd> on Windows and Linux)*

---

## 🧪 Testing

Run the automated verification suite to validate data schemas, assets, and desktop interfaces:
```bash
npm test
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
Created with commitment to marine education by [Sahil Shingate](https://github.com/sahilshingate01).
