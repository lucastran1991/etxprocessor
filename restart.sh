#!/bin/bash

# ETX Processor - Restart Script
# This script restarts both the backend and frontend services

set -e

echo "🔄 Restarting ETX Processor..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Main execution
main() {
    echo -e "${GREEN}🔄 ETX Processor - Restarting Services${NC}"
    echo -e "${GREEN}=====================================${NC}"
    
    # Change to script directory
    cd "$SCRIPT_DIR"
    
    # Stop services first
    echo -e "${BLUE}🛑 Stopping services...${NC}"
    if [ -f "./stop.sh" ]; then
        bash ./stop.sh
    else
        echo -e "${RED}❌ stop.sh not found${NC}"
        exit 1
    fi
    
    # Wait a moment for processes to fully stop
    echo -e "${BLUE}⏳ Waiting for processes to stop...${NC}"
    sleep 2
    
    # Start services
    echo -e "${BLUE}🚀 Starting services...${NC}"
    if [ -f "./start.sh" ]; then
        bash ./start.sh
    else
        echo -e "${RED}❌ start.sh not found${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
