#!/bin/bash

# ETX Processor - Start Script
# This script starts both the backend and frontend services

set -e

echo "🚀 Starting ETX Processor..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}📦 Starting Backend...${NC}"
    
    if check_port 8000; then
        echo -e "${YELLOW}⚠️  Port 8000 is already in use. Backend might already be running.${NC}"
    else
        cd backend
        if [ ! -d "venv" ]; then
            echo -e "${YELLOW}⚠️  Virtual environment not found. Creating one...${NC}"
            python3 -m venv venv
        fi
        
        source venv/bin/activate
        
        if [ ! -f "requirements.txt" ]; then
            echo -e "${RED}❌ requirements.txt not found in backend directory${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}📥 Installing backend dependencies...${NC}"
        pip install -r requirements.txt

        # Resolve DATABASE_URL (prefer existing env). If absent, pick Postgres when available, else SQLite
        if [ -z "${DATABASE_URL}" ]; then
            if check_port 5432; then
                export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/etxprocessor"
                echo -e "${BLUE}🗄️  Using PostgreSQL at ${DATABASE_URL}${NC}"
            else
                export DATABASE_URL="sqlite:///app/models/your_database.db"
                echo -e "${YELLOW}⚠️  PostgreSQL not available; falling back to SQLite (${DATABASE_URL})${NC}"
            fi
        else
            echo -e "${BLUE}🗄️  Using DATABASE_URL from environment${NC}"
        fi

        # Run Alembic only when targeting PostgreSQL
        if [[ "${DATABASE_URL}" == postgresql* ]]; then
            echo -e "${BLUE}🗄️  Running database migrations...${NC}"
            alembic upgrade head
        else
            echo -e "${YELLOW}⏭️  Skipping Alembic migrations for SQLite; relying on AUTO_CREATE_DB${NC}"
        fi
        
        echo -e "${BLUE}🔧 Starting FastAPI server...${NC}"
        # Write to unified system.log with [BE] tag
        nohup python -m uvicorn main:app --host 127.0.0.1 --port 8000 2>&1 | sed -e 's/^/[BE] /' >> ../system.log &
        echo $! > ../backend.pid
        
        cd ..
        echo -e "${GREEN}✅ Backend started successfully on http://127.0.0.1:8000${NC}"
    fi
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}🎨 Starting Frontend...${NC}"
    
    if check_port 8888; then
        echo -e "${YELLOW}⚠️  Port 8888 is already in use. Frontend might already be running.${NC}"
    else
        cd frontend
        
        if [ ! -f "package.json" ]; then
            echo -e "${RED}❌ package.json not found in frontend directory${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}📥 Installing frontend dependencies...${NC}"
        npm install
        
        echo -e "${BLUE}🔧 Starting Next.js development server...${NC}"
        # Write to unified system.log with [FE] tag and bind to port 8888
        nohup env PORT=8888 npm run dev 2>&1 | sed -e 's/^/[FE] /' >> ../system.log &
        echo $! > ../frontend.pid
        
        cd ..
        echo -e "${GREEN}✅ Frontend started successfully on http://localhost:8888${NC}"
    fi
}

# Function to wait for services to be ready
wait_for_services() {
    echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
    
    # Wait for backend
    for i in {1..30}; do
        if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is ready${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Backend failed to start within 30 seconds${NC}"
            exit 1
        fi
        sleep 1
    done
    
    # Wait for frontend
    for i in {1..30}; do
        if curl -s http://localhost:8888 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend is ready${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Frontend failed to start within 30 seconds${NC}"
            exit 1
        fi
        sleep 1
    done
}

# Main execution
main() {
    echo -e "${GREEN}🎯 ETX Processor - Development Environment${NC}"
    echo -e "${GREEN}==========================================${NC}"
    
    # Check if we're in the right directory
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        echo -e "${RED}❌ Please run this script from the project root directory${NC}"
        exit 1
    fi
    
    # Start services
    start_backend
    start_frontend
    
    # Wait for services to be ready
    wait_for_services
    
    echo -e "${GREEN}🎉 ETX Processor is now running!${NC}"
    echo -e "${GREEN}================================${NC}"
    echo -e "${BLUE}Backend API:  http://127.0.0.1:8000${NC}"
    echo -e "${BLUE}Frontend UI:  http://localhost:8888${NC}"
    echo -e "${BLUE}API Docs:     http://127.0.0.1:8000/docs${NC}"
    echo ""
    echo -e "${YELLOW}📝 Logs:${NC}"
    echo -e "${YELLOW}  Unified:  tail -f system.log${NC}"
    echo ""
    echo -e "${YELLOW}🛑 To stop: ./stop.sh${NC}"
    echo -e "${YELLOW}🔄 To restart: ./restart.sh${NC}"
}

# Run main function
main "$@"
