#!/bin/bash

# ETX Processor - Stop Script
# This script stops both the backend and frontend services

set -e

echo "🛑 Stopping ETX Processor..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to stop service by PID file
stop_service() {
    local service_name=$1
    local pid_file=$2
    local port=$3
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${BLUE}🛑 Stopping $service_name (PID: $pid)...${NC}"
            kill $pid
            rm -f "$pid_file"
            echo -e "${GREEN}✅ $service_name stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  $service_name process not found (PID: $pid)${NC}"
            rm -f "$pid_file"
        fi
    else
        echo -e "${YELLOW}⚠️  No PID file found for $service_name${NC}"
    fi
    
    # Also try to kill any processes using the port
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${BLUE}🔍 Found process using port $port, stopping...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✅ Port $port freed${NC}"
    fi
}

# Function to stop all uvicorn processes
stop_uvicorn() {
    echo -e "${BLUE}🔍 Looking for uvicorn processes...${NC}"
    local uvicorn_pids=$(pgrep -f "uvicorn.*main:app" || true)
    if [ ! -z "$uvicorn_pids" ]; then
        echo -e "${BLUE}🛑 Stopping uvicorn processes: $uvicorn_pids${NC}"
        echo $uvicorn_pids | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✅ Uvicorn processes stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  No uvicorn processes found${NC}"
    fi
}

# Function to stop all Next.js processes
stop_nextjs() {
    echo -e "${BLUE}🔍 Looking for Next.js processes...${NC}"
    local nextjs_pids=$(pgrep -f "next dev" || true)
    if [ ! -z "$nextjs_pids" ]; then
        echo -e "${BLUE}🛑 Stopping Next.js processes: $nextjs_pids${NC}"
        echo $nextjs_pids | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✅ Next.js processes stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  No Next.js processes found${NC}"
    fi
}

# Main execution
main() {
    echo -e "${GREEN}🛑 ETX Processor - Stopping Services${NC}"
    echo -e "${GREEN}====================================${NC}"
    
    # Stop services by PID files
    stop_service "Backend" "backend.pid" "8000"
    stop_service "Frontend" "frontend.pid" "8888"
    
    # Stop any remaining processes
    stop_uvicorn
    stop_nextjs
    
    # Clean up log files
    if [ -f "backend.log" ]; then
        echo -e "${BLUE}📝 Backend log: backend.log${NC}"
    fi
    if [ -f "frontend.log" ]; then
        echo -e "${BLUE}📝 Frontend log: frontend.log${NC}"
    fi
    
    echo -e "${GREEN}🎉 ETX Processor stopped successfully!${NC}"
    echo -e "${YELLOW}💡 To start again: ./start.sh${NC}"
}

# Run main function
main "$@"
