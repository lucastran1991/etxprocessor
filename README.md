# ETX Processor

A full-stack web application for financial data processing with user management, authentication, and gamification features.

## Project Structure

- **Backend**: Python FastAPI with FastAPIUser authentication
- **Frontend**: Next.js 13.x with Chakra UI
- **Database**: PostgreSQL
- **Deployment**: Direct source code deployment to AWS EC2

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18.x
- PostgreSQL

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

6. **Start the server**
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Features

- **User Authentication**: Register, login, logout with JWT tokens
- **User Management**: Profile management with avatar upload
- **Role-based Access**: Admin, user, and moderator roles
- **Gamification**: User levels and experience points
- **Modern UI**: Responsive design with Chakra UI
- **API Documentation**: Auto-generated OpenAPI/Swagger docs

## API Endpoints

- **Authentication**:
  - `POST /api/v1/auth/register` - User registration
  - `POST /api/v1/auth/login` - User login
  - `GET /api/v1/auth/me` - Get current user

- **API Documentation**: http://localhost:8000/docs

## Development

### Backend Development
```bash
cd backend
uvicorn main:app --reload
```

### Frontend Development
```bash
cd frontend
npm run dev
```

## Deployment

See the task-master-ai system for detailed deployment instructions to AWS EC2.

## License

MIT License
