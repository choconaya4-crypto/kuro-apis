# KuroCodex - AI Chat API Platform

Platform AI Chat API dengan dashboard admin untuk manajemen user. Menggunakan Firebase Google Authentication dan free models dari OpenRouter.

## Features

- Firebase Google Authentication
- Admin Dashboard untuk manage users
- Multiple AI models (Gemini, DeepSeek, Llama, Mistral, Phi)
- REST API untuk chat dengan AI
- Usage tracking dan analytics
- VPS deployment ready

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Firebase Project

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Buat project baru atau gunakan existing
3. Enable Google Sign-in:
   - Go to Authentication > Sign-in method
   - Enable Google provider
   - Add authorized domains
4. Get Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps" > Web app
   - Copy the config

### 3. Setup Environment Variables
Buat file `.env`:
```env
VITE_SUPABASE_URL=https://rdkkonhcgwgsfxkwbdjx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Admin Emails (comma-separated)
VITE_ADMIN_EMAILS=admin@kurocodex.ai,your-email@gmail.com

# Get from https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm run preview
```

## API Endpoints

### Proxy Endpoints (Security Layer)

All API calls go through `/functions/v1/proxy` for security:

- **Rate Limiting:** 100 requests/minute per IP
- **Security Headers:** XSS Protection, Content-Security-Policy, etc.
- **Access Control:** API key and role verification
- **Request Validation:** All inputs validated

### Chat API (via Proxy)
```bash
# List available models
curl https://your-domain.com/functions/v1/proxy/chat/models

# Chat with AI
curl -X POST https://your-domain.com/functions/v1/proxy/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "model": "gemini"
  }'
```

### Auth API (via Proxy)
```bash
# Register
curl -X POST https://your-domain.com/functions/v1/proxy/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "username",
    "password": "password123"
  }'

# Login
curl -X POST https://your-domain.com/functions/v1/proxy/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Admin API (via Proxy)
```bash
# Get dashboard stats
curl https://your-domain.com/functions/v1/proxy/admin/stats \
  -H "Authorization: Bearer ADMIN_API_KEY"

# List all users
curl https://your-domain.com/functions/v1/proxy/admin/users \
  -H "Authorization: Bearer ADMIN_API_KEY"

# Create user
curl -X POST https://your-domain.com/functions/v1/proxy/admin/users \
  -H "Authorization: Bearer ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "password123",
    "role": "user"
  }'

# Update user
curl -X PUT https://your-domain.com/functions/v1/proxy/admin/users/USER_ID \
  -H "Authorization: Bearer ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": true
  }'

# Delete user
curl -X DELETE https://your-domain.com/functions/v1/proxy/admin/users/USER_ID \
  -H "Authorization: Bearer ADMIN_API_KEY"

# Regenerate API key
curl -X POST https://your-domain.com/functions/v1/proxy/admin/users/USER_ID/regenerate-key \
  -H "Authorization: Bearer ADMIN_API_KEY"
```

## Available AI Models

All models are FREE via OpenRouter:

| Model Name | Model ID | Best For |
|------------|----------|----------|
| gemini | google/gemini-2.0-flash-lite-001 | Fast responses, general chat |
| deepseek | deepseek/deepseek-chat | Coding, reasoning |
| llama | meta-llama/llama-3.2-3b-instruct:free | General purpose |
| mistral | mistralai/mistral-7b-instruct:free | Fast, efficient |
| phi | microsoft/phi-3-mini-128k-instruct:free | Quick answers |

## Default Admin Account

Admin access dikontrol oleh environment variable `VITE_EMAILS`. Email yang terdaftar di env akan otomatis mendapat role admin saat login pertama kali.

```env
# Di file .env
VITE_ADMIN_EMAILS=admin@kurocodex.ai,your-email@gmail.com
```

**Note:** Tidak ada password - semua authentication via Firebase Google OAuth!

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase Edge Functions
- **Proxy Layer:** Security middleware with rate limiting
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Firebase Google OAuth
- **AI Provider:** OpenRouter (Free models)
- **Icons:** Lucide React

## Authentication

KuroCodex menggunakan Firebase Google Authentication:

- **Login:** Klik button "Login dengan Google"
- **Admin Access:** Email yang terdaftar di `VITE_ADMIN_EMAILS` otomatis jadi admin
- **No Passwords:** Semua handled by Firebase, lebih secure!
- **Session:** Firebase handles auto-login dan session management

## Security Features

- **Rate Limiting:** 100 requests per minute per IP
- **Security Headers:**
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Content-Security-Policy: default-src 'self'
  - Referrer-Policy: strict-origin-when-cross-origin
- **Proxy Layer:** All API calls go through `/proxy` endpoint
- **Input Validation:** All requests validated
- **Role-based Access:** Admin vs User permissions
- **API Key Verification:** Every request verified

## Project Structure

```
kurocodex/
├── src/
│   ├── components/       # React components
│   │   ├── Auth.tsx      # Login/Register
│   │   └── Dashboard.tsx  # Admin dashboard
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/              # Utilities
│   │   ├── api.ts        # API functions (uses proxy)
│   │   └── supabase.ts   # Supabase client
│   ├── types/            # TypeScript types
│   │   └── database.ts
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── functions/        # Edge functions
│       ├── proxy/        # Security proxy (rate limit, validation)
│       ├── auth/         # Authentication
│       ├── chat/         # Chat API
│       └── admin/        # Admin API
├── DEPLOYMENT.md         # VPS deployment guide
└── README.md
```

## API Architecture

```
Client Request
     ↓
[PROXY] ← Rate Limiting + Security Headers + Validation
     ↓
  ┌──┴──┐
  │ Auth │  Chat │ Admin │ ← Internal Functions
  └──┬──┘
     ↓
Database / OpenRouter API
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete VPS deployment tutorial with:
- Domain setup
- SSL certificate (free)
- Nginx configuration
- PM2 process manager
- OpenRouter API integration

## Get OpenRouter API Key

1. Visit https://openrouter.ai
2. Sign up with Google/GitHub
3. Go to Dashboard > API Keys
4. Click "Create API Key"
5. Copy key (format: `sk-or-v1-xxxxx`)
6. Add to `.env` file

You get $1 free credit, but free models don't use credits!

## License

MIT
