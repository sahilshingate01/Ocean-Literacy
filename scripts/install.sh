#!/usr/bin/env bash
# ==============================================================================
# Ocean Literacy Desktop Application - Automated Installation & Setup Script
# Supports: macOS (Darwin) & Linux distributions
# ==============================================================================

set -e

# ANSI Color Codes
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "=========================================================="
echo "      OCEAN LITERACY DESKTOP — INSTALLATION SCRIPT        "
echo "=========================================================="
echo -e "${NC}"

# 1. Check Node.js Requirement
echo -e "${YELLOW}[1/5] Checking Node.js runtime environment...${NC}"
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}Error: Node.js is not installed! Please install Node.js (v18.0.0 or higher) from https://nodejs.org${NC}"
  exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js detected: ${NODE_VERSION}${NC}"

# 2. Check npm Requirement
echo -e "${YELLOW}[2/5] Checking npm package manager...${NC}"
if ! command -v npm >/dev/null 2>&1; then
  echo -e "${RED}Error: npm is not available!${NC}"
  exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm detected: ${NPM_VERSION}${NC}"

# 3. Verify Project Integrity & Generate Branding Icons
echo -e "${YELLOW}[3/5] Generating desktop branding & icon assets...${NC}"
node scripts/generate-icons.js
echo -e "${GREEN}✓ Branding assets ready.${NC}"

# 4. Run Self-Verification & Data Integrity Check
echo -e "${YELLOW}[4/5] Running verification and test suite...${NC}"
node test/app.test.js
echo -e "${GREEN}✓ All module and data tests passed.${NC}"

# 5. Dependency Installation Prompt or Execution
echo -e "${YELLOW}[5/5] Ready to install dependencies and run!${NC}"
echo -e "${CYAN}To install desktop dependencies and start the app:${NC}"
echo "    npm install"
echo "    npm start"
echo ""
echo -e "${CYAN}To package standalone desktop installers (.dmg, .zip, .AppImage, .deb):${NC}"
echo "    npm run dist:mac"
echo "    npm run dist:linux"
echo "=========================================================="
echo -e "${GREEN}✓ Ocean Literacy setup complete!${NC}"
