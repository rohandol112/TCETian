# Environment Variables to Set in Vercel Dashboard

## Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

## Add these variables:

# API Configuration
VITE_API_URL=https://tcetian.onrender.com/api
VITE_API_BASE_URL=https://tcetian.onrender.com/api
VITE_MEDIA_BASE_URL=https://tcetian.onrender.com
VITE_SOCKET_URL=https://tcetian.onrender.com

# App Configuration
VITE_APP_NAME=TCETian
VITE_COLLEGE_NAME=Thakur College of Engineering and Technology
VITE_ENVIRONMENT=production

## After adding these variables:
1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Your frontend will now connect to your Render backend

## Test URLs:
- Frontend: https://tcetian.vercel.app
- Backend Health: https://tcetian.onrender.com/health
- Backend API Test: https://tcetian.onrender.com/api/test