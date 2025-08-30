# Setup Guide

## Local Development Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- Git

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your SECRET_KEY
python app.py
```

Backend will run on http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend will run on http://localhost:3000

### Testing

1. Open http://localhost:3000
2. Register a new account
3. Set up Reddit API credentials
4. Test bot functionality

## Production Deployment

### Backend to Railway

```bash
cd backend
npm install -g @railway/cli
railway login
railway init
railway up
```

Set environment variables in Railway dashboard:

- `SECRET_KEY`: Generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`

### Frontend to Netlify

```bash
cd frontend
npm run build
# Deploy build folder to Netlify
```

Update `src/config.js` with your Railway URL before building.
