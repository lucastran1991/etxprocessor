#!/bin/bash

# ETX Processor - Status Script
# This script checks the status of both backend and frontend services

set -e

echo "📊 ETX Processor - Service Status"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check service status
check_service() {
    local service_name=$1
    local port=$2
    local url=$3
    local pid_file=$4
    
    echo -e "${BLUE}🔍 Checking $service_name...${NC}"
    
    # Check if PID file exists and process is running
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "  ${GREEN}✅ Process running (PID: $pid)${NC}"
        else
            echo -e "  ${RED}❌ Process not running (stale PID file)${NC}"
            rm -f "$pid_file"
        fi
    else
        echo -e "  ${YELLOW}⚠️  No PID file found${NC}"
    fi
    
    # Check if port is in use
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Port $port is in use${NC}"
    else
        echo -e "  ${RED}❌ Port $port is not in use${NC}"
    fi
    
    # Check if service responds to HTTP requests
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Service responding at $url${NC}"
    else
        echo -e "  ${RED}❌ Service not responding at $url${NC}"
    fi
    
    echo ""
}

# Function to show process information
show_processes() {
    echo -e "${BLUE}🔍 Running Processes:${NC}"
    
    # Show uvicorn processes
    local uvicorn_pids=$(pgrep -f "uvicorn.*main:app" || true)
    if [ ! -z "$uvicorn_pids" ]; then
        echo -e "  ${GREEN}Backend (uvicorn):${NC}"
        ps -p $uvicorn_pids -o pid,ppid,command | sed 's/^/    /'
    else
        echo -e "  ${RED}No uvicorn processes found${NC}"
    fi
    
    # Show Next.js processes
    local nextjs_pids=$(pgrep -f "next dev" || true)
    if [ ! -z "$nextjs_pids" ]; then
        echo -e "  ${GREEN}Frontend (Next.js):${NC}"
        ps -p $nextjs_pids -o pid,ppid,command | sed 's/^/    /'
    else
        echo -e "  ${RED}No Next.js processes found${NC}"
    fi
    
    echo ""
}

# Function to show log file information
show_logs() {
    echo -e "${BLUE}📝 Log Files:${NC}"
    
    if [ -f "backend.log" ]; then
        local backend_size=$(wc -l < backend.log)
        echo -e "  ${GREEN}Backend log: backend.log ($backend_size lines)${NC}"
    else
        echo -e "  ${YELLOW}Backend log: backend.log (not found)${NC}"
    fi
    
    if [ -f "frontend.log" ]; then
        local frontend_size=$(wc -l < frontend.log)
        echo -e "  ${GREEN}Frontend log: frontend.log ($frontend_size lines)${NC}"
    else
        echo -e "  ${YELLOW}Frontend log: frontend.log (not found)${NC}"
    fi
    
    echo ""
}

# Main execution
main() {
    # Check backend
    check_service "Backend" "8000" "http://127.0.0.1:8000/health" "backend.pid"
    
    # Check frontend
    check_service "Frontend" "8888" "http://localhost:8888" "frontend.pid"
    
    # Show process information
    show_processes
    
    # Show log information
    show_logs
    
    # Summary
    echo -e "${BLUE}📊 Summary:${NC}"
    local backend_running=false
    local frontend_running=false
    
    if curl -s "http://127.0.0.1:8000/health" > /dev/null 2>&1; then
        backend_running=true
    fi
    
    if curl -s "http://localhost:8888" > /dev/null 2>&1; then
        frontend_running=true
    fi
    
    if [ "$backend_running" = true ] && [ "$frontend_running" = true ]; then
        echo -e "  ${GREEN}🎉 All services are running!${NC}"
        echo -e "  ${GREEN}   Backend:  http://127.0.0.1:8000${NC}"
        echo -e "  ${GREEN}   Frontend: http://localhost:8888${NC}"
    elif [ "$backend_running" = true ]; then
        echo -e "  ${YELLOW}⚠️  Backend is running, but frontend is not${NC}"
    elif [ "$frontend_running" = true ]; then
        echo -e "  ${YELLOW}⚠️  Frontend is running, but backend is not${NC}"
    else
        echo -e "  ${RED}❌ No services are running${NC}"
        echo -e "  ${YELLOW}💡 Run ./start.sh to start the services${NC}"
    fi
}

# Run main function
main "$@"
