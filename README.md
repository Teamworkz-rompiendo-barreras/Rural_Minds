# Teamworkz SaaS Platform

Inclusive workplace platform for neurodivergent talent.

## Structure
- `/frontend` - React + Vite + TypeScript
- `/backend` - FastAPI + SQLAlchemy + PostgreSQL

## Local Development

### Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.vercel.app
```

## Deployment
- **Frontend**: Vercel (auto-deploy from GitHub)
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase PostgreSQL
