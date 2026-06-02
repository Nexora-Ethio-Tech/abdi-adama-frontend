#!/bin/bash

# ==========================================
# Abdi Adama Full-Stack Automated Deployment
# ==========================================

# Configuration - adjust these paths if your cPanel structure is different
BACKEND_DIR="$HOME/repositories/abdi-adama-backend"
FRONTEND_DIR="$HOME/repositories/abdi-adama-frontend"
PUBLIC_HTML="$HOME/public_html"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Deployment Process...${NC}\n"

# Step 1: Deploy Backend
echo -e "${YELLOW}==========================================${NC}"
echo -e "${YELLOW}Step 1: Updating Backend${NC}"
echo -e "${YELLOW}==========================================${NC}"

if [ -d "$BACKEND_DIR" ]; then
    cd "$BACKEND_DIR" || exit 1
    
    echo -e "➔ Pulling latest backend code..."
    git pull origin main
    
    echo -e "➔ Installing backend dependencies..."
    npm install
    
    echo -e "➔ Building backend..."
    npm run build
    
    echo -e "➔ Restarting Node.js application..."
    # Passenger (cPanel Node.js App) automatically restarts if you touch tmp/restart.txt
    mkdir -p tmp
    touch tmp/restart.txt
    
    echo -e "${GREEN}✓ Backend updated and restarted successfully!${NC}\n"
else
    echo -e "${RED}Error: Backend directory not found at $BACKEND_DIR.${NC}"
    echo -e "Make sure the repository folder name matches.${NC}\n"
fi


# Step 2: Deploy Frontend
echo -e "${YELLOW}==========================================${NC}"
echo -e "${YELLOW}Step 2: Updating Frontend${NC}"
echo -e "${YELLOW}==========================================${NC}"

if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR" || exit 1
    
    echo -e "➔ Pulling latest frontend code..."
    git pull origin main
    
    echo -e "➔ Installing frontend dependencies..."
    npm install
    
    echo -e "➔ Building frontend..."
    npm run build
    
    echo -e "➔ Deploying frontend to public_html..."
    # Copy build artifacts directly to public_html
    cp -r dist/* "$PUBLIC_HTML/"
    
    echo -e "${GREEN}✓ Frontend built and deployed successfully!${NC}\n"
else
    echo -e "${RED}Error: Frontend directory not found at $FRONTEND_DIR.${NC}"
    echo -e "Make sure the repository folder name matches.${NC}\n"
fi

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}✨ Deployment Complete! ✨${NC}"
echo -e "${GREEN}==========================================${NC}"
