# TCETian Deployment Guide

## Backend Deployment on Render

### Prerequisites
1. Push your code to GitHub repository
2. Create a [Render account](https://render.com)
3. Set up MongoDB Atlas for database (or use Render's managed MongoDB)

### Step-by-Step Deployment

#### Option 1: Using Render.yaml (Recommended)
1. **Connect GitHub Repository**
   - Go to Render Dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the `backend` folder as the root directory
   - Render will automatically detect the `render.yaml` file

2. **Configure Environment Variables**
   The following environment variables need to be set in Render:
   ```
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_SECRET=<generate-a-secure-random-string>
   JWT_EXPIRES_IN=7d
   EMAIL_USER=<your-gmail-address>
   EMAIL_PASS=<your-gmail-app-password>
   FRONTEND_URL=https://tcetian.vercel.app
   ```

#### Option 2: Manual Web Service Creation
1. **Create New Web Service**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Set root directory to `backend`

2. **Configure Build & Start Commands**
   ```
   Build Command: npm ci
   Start Command: npm start
   ```

3. **Set Environment Variables** (same as above)

#### Option 3: Using Docker (Alternative)
1. **Create Web Service from Docker**
   - Select "Deploy from Docker Hub or GitHub"
   - Connect repository and select `backend` folder
   - Render will detect the Dockerfile automatically

### MongoDB Setup
If you don't have MongoDB Atlas:

1. **MongoDB Atlas (Recommended)**
   - Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create new cluster (free tier available)
   - Get connection string
   - Add to RENDER environment variables as `MONGODB_URI`

2. **Or use Render's MongoDB Add-on**
   - In your Render service, go to "Environment"
   - Add MongoDB add-on (paid service)

### Email Configuration
For event notifications and user emails:

1. **Gmail Setup**
   - Enable 2FA on your Gmail account
   - Generate App Password: Google Account → Security → App Passwords
   - Use the app password as `EMAIL_PASS`

2. **Alternative Email Services**
   - SendGrid, Mailgun, or other SMTP services
   - Update email configuration in backend accordingly

### Health Check & Monitoring
- Health endpoint: `https://your-app.render.com/health`
- Render provides automatic health checks
- Monitor logs in Render dashboard

---

## Frontend Deployment on Vercel

Your frontend is already deployed at: https://tcetian.vercel.app

### Update Frontend Configuration

1. **Update API URL in Vercel**
   Once your backend is deployed on Render, you'll get a URL like:
   `https://tcetian-backend-xyz.onrender.com`

2. **Set Vercel Environment Variables**
   In your Vercel dashboard, go to Settings → Environment Variables:
   ```
   VITE_API_URL=https://your-backend-app.onrender.com/api
   VITE_API_BASE_URL=https://your-backend-app.onrender.com/api
   VITE_MEDIA_BASE_URL=https://your-backend-app.onrender.com
   ```

3. **Redeploy Frontend**
   - Push changes to your GitHub repository
   - Vercel will automatically redeploy with new environment variables

### Update CORS Configuration
Once you have your Render URL, update the backend CORS configuration in `src/app.js`:

```javascript
app.use(cors({
  origin: [
    'https://tcetian.vercel.app',
    'http://localhost:5173', // for development
  ],
  credentials: true,
  // ... other CORS options
}))
```

---

## Post-Deployment Checklist

### Backend (Render)
- [ ] Service is running and healthy
- [ ] Database connection is working
- [ ] Environment variables are set correctly
- [ ] Health endpoint responds: `/health`
- [ ] CORS is configured for your frontend domain
- [ ] Email service is working (test user registration)

### Frontend (Vercel)
- [ ] Site loads without errors
- [ ] API calls are reaching the backend
- [ ] Authentication works
- [ ] Event creation/management works
- [ ] Real-time features (WebSocket) work

### Testing
1. **API Connection Test**
   ```bash
   curl https://your-backend-app.onrender.com/health
   ```

2. **Frontend-Backend Integration**
   - Test user registration/login
   - Test event creation
   - Test real-time updates

### Monitoring & Maintenance
- Monitor Render service logs for errors
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor database usage and performance
- Regularly check for security updates

---

## Common Issues & Solutions

### 1. CORS Errors
- Ensure frontend URL is added to backend CORS configuration
- Check environment variables are set correctly

### 2. Database Connection Issues
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas (allow all: 0.0.0.0/0 for Render)

### 3. Build Failures
- Check Node.js version compatibility (backend uses Node 18)
- Verify all dependencies are in package.json
- Check for missing environment variables

### 4. WebSocket Issues
- Render supports WebSockets on paid plans
- For free tier, consider polling instead of real-time updates

### 5. File Upload Issues
- Render's free tier has ephemeral storage
- Consider using cloud storage (AWS S3, Cloudinary) for file uploads

---

## Cost Estimation

### Render (Backend)
- **Free Tier**: $0/month
  - 512MB RAM, shared CPU
  - Sleeps after 15 minutes of inactivity
  - 750 hours/month limit

- **Starter Plan**: $7/month
  - 512MB RAM, shared CPU
  - No sleeping, custom domains
  - Unlimited hours

### Vercel (Frontend)
- **Hobby Plan**: Free
  - 100GB bandwidth/month
  - Perfect for your current needs

### MongoDB Atlas
- **Free Tier**: $0/month
  - 512MB storage
  - Shared clusters
  - Good for development/testing

### Total Monthly Cost: $0-7 (depending on backend plan choice)

---

## Next Steps

1. **Deploy Backend**: Follow the Render deployment steps above
2. **Update Frontend**: Set the correct API URL in Vercel environment variables
3. **Test Integration**: Verify all features work end-to-end
4. **Monitor**: Set up monitoring and error tracking
5. **Scale**: Upgrade to paid plans as needed based on usage

Need help with any specific step? Let me know!