# Installation Guide — Ocean Literacy Desktop

This document outlines instructions for installing, configuring, and executing the Ocean Literacy Desktop Application across platforms.

---

## System Requirements

| Specification | Requirement |
| :--- | :--- |
| **Operating System** | macOS 11+, Windows 10/11 (64-bit), Ubuntu 20.04+ (or equivalent Linux) |
| **Node.js** | v18.0.0 or later (v20+ recommended) |
| **Memory (RAM)** | Minimum 2 GB (4 GB recommended) |
| **Disk Space** | 250 MB free space for application & runtime |

---

## Installation by Platform

### macOS Installation

1. **Prerequisites Verification:**
   Ensure Node.js and npm are present:
   ```bash
   node -v
   npm -v
   ```

2. **Automated Setup:**
   Run the setup script:
   ```bash
   ./scripts/install.sh
   ```

3. **Install Dependencies & Launch:**
   ```bash
   npm install
   npm start
   ```

4. **Generating macOS Disk Image (.dmg):**
   ```bash
   npm run dist:mac
   ```
   Open `dist/Ocean Literacy-1.0.0.dmg` and drag the application to `/Applications`.

---

### Windows Installation

1. **Automated Setup:**
   Double click or execute from Command Prompt / PowerShell:
   ```cmd
   scripts\install.bat
   ```

2. **Launch Application:**
   ```cmd
   npm install
   npm start
   ```

3. **Generating Windows Installer (.exe):**
   ```cmd
   npm run dist:win
   ```
   The generated NSIS setup wizard will be saved in `dist\Ocean Literacy Setup 1.0.0.exe`.

---

### Linux Installation

1. **Install Dependencies:**
   ```bash
   chmod +x scripts/install.sh
   ./scripts/install.sh
   npm install
   ```

2. **Run Desktop App:**
   ```bash
   npm start
   ```

3. **Package AppImage & Debian Package:**
   ```bash
   npm run dist:linux
   ```
   Executable `.AppImage` and `.deb` packages will be placed in `dist/`.

---

## Verifying the Installation

To verify that all files, datasets, and icons are correctly positioned:
```bash
npm run verify
```
or
```bash
npm test
```
