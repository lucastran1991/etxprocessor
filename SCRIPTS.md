# ETX Processor - Management Scripts

This directory contains shell scripts to easily manage the ETX Processor development environment.

## Available Scripts

### 🚀 `./start.sh`
Starts both the backend and frontend services.

**What it does:**
- Creates virtual environment for backend if it doesn't exist
- Installs backend dependencies
- Runs database migrations
- Starts FastAPI server on port 8000
- Installs frontend dependencies
- Starts Next.js development server on port 8888
- Waits for both services to be ready
- Shows service URLs and helpful information

**Usage:**
```bash
./start.sh
```

### 🛑 `./stop.sh`
Stops both the backend and frontend services.

**What it does:**
- Stops processes using PID files
- Kills any processes using ports 8000 and 8888
- Cleans up stale PID files
- Shows log file locations

**Usage:**
```bash
./stop.sh
```

### 🔄 `./restart.sh`
Restarts both services by stopping and then starting them.

**What it does:**
- Calls `./stop.sh` to stop services
- Waits for processes to fully stop
- Calls `./start.sh` to start services

**Usage:**
```bash
./restart.sh
```

### 📊 `./status.sh`
Shows the current status of both services.

**What it does:**
- Checks if processes are running
- Verifies ports are in use
- Tests HTTP endpoints
- Shows process information
- Displays log file information
- Provides a summary of service status

**Usage:**
```bash
./status.sh
```

## Service URLs

When running, the services are available at:

- **Backend API**: http://127.0.0.1:8000
- **Frontend UI**: http://localhost:8888
- **API Documentation**: http://127.0.0.1:8000/docs

## Log Files

The scripts create log files in the project root:

- `backend.log` - Backend server logs
- `frontend.log` - Frontend development server logs

To view logs in real-time:
```bash
# Backend logs
tail -f backend.log

# Frontend logs
tail -f frontend.log

# Both logs
tail -f *.log
```

## Process Management

The scripts use PID files to track running processes:

- `backend.pid` - Contains the backend process ID
- `frontend.pid` - Contains the frontend process ID

These files are automatically created when starting services and removed when stopping them.

## Prerequisites

Before running the scripts, ensure you have:

- **Python 3.9+** installed
- **Node.js 18.x** installed
- **PostgreSQL** running and accessible
- **Environment variables** configured (see `.env.example` files)

## Troubleshooting

### Port Already in Use
If you get "address already in use" errors:
```bash
./stop.sh  # Stop all services
./start.sh # Start fresh
```

### Services Not Starting
Check the log files for detailed error messages:
```bash
tail -f backend.log
tail -f frontend.log
```

### Database Issues
Ensure PostgreSQL is running and the database exists:
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Or on Linux
sudo systemctl status postgresql
```

### Permission Issues
Make sure the scripts are executable:
```bash
chmod +x *.sh
```

## Development Workflow

1. **Start development**: `./start.sh`
2. **Check status**: `./status.sh`
3. **View logs**: `tail -f *.log`
4. **Restart after changes**: `./restart.sh`
5. **Stop when done**: `./stop.sh`

## Notes

- All scripts include colored output for better readability
- Scripts automatically handle dependency installation
- Database migrations are run automatically on startup
- Services are started in the background with nohup
- The scripts are designed to be idempotent (safe to run multiple times)
