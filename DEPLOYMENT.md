# Deployment Guide

## Frontend Deployment (Vercel) ✅

### 1. Prepare Frontend for Deployment

The frontend has been updated to use environment variables for API calls. Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:3001
```

### 2. Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Link to existing project or create new
   - Set build command: `npm run build`
   - Set output directory: `build`

### 3. Set Environment Variables in Vercel

In your Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add: `REACT_APP_API_URL` = your Railway backend URL

## Backend Deployment (Railway) ✅

### 1. Prepare Backend for Railway

The backend has been updated with:
- ✅ Proper `package.json` with ES modules support
- ✅ CORS configuration for production
- ✅ Health check endpoint
- ✅ Environment variable handling
- ✅ File upload configuration

### 2. Deploy to Railway

1. **Sign up at [railway.app](https://railway.app)**
   - Use your GitHub account to sign up

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub repository

3. **Configure Deployment Settings**
   - **Root Directory:** `backend` (since backend is in a subdirectory)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Node Version:** 18+ (automatically detected)

4. **Set Environment Variables**
   In Railway dashboard, add these variables:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   NODE_ENV=production
   ```

5. **Deploy**
   - Railway will automatically deploy your backend
   - You'll get a URL like: `https://your-app-name.railway.app`

### 3. Test Your Railway Backend

1. **Health Check:**
   Visit: `https://your-app-name.railway.app/health`
   Expected response: `{"status":"OK","timestamp":"...","environment":"production"}`

2. **Test API Endpoints:**
   - Test with Postman or curl
   - Ensure all endpoints are working

### 4. Update CORS for Production

Once you have your Vercel frontend URL, update the CORS configuration in `backend/index.js`:

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.vercel.app'] // Replace with your Vercel URL
    : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}
```
## Environment Variables

### Frontend (.env file)
```env
REACT_APP_API_URL=https://your-backend-url.railway.app
```

### Backend (Railway Dashboard)
```env
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=production
PORT=3001
```

## File Upload Considerations

Your app uses temporary file storage for audio processing. Railway supports:
- ✅ File system write permissions
- ✅ Adequate storage for temporary files
- ✅ Proper cleanup of temporary files
- ✅ Automatic scaling

## Recommended Deployment Stack

1. **Frontend:** Vercel (React hosting)
2. **Backend:** Railway (Node.js with file handling)
3. **Environment Variables:** Set in both platforms
4. **Domain:** Custom domain (optional)

## Deployment Checklist

### Backend (Railway)
- [ ] Sign up for Railway
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend`
- [ ] Set environment variables
- [ ] Deploy and test health endpoint
- [ ] Test API endpoints

### Frontend (Vercel)
- [ ] Deploy to Vercel
- [ ] Set `REACT_APP_API_URL` environment variable
- [ ] Update CORS in backend with Vercel URL
- [ ] Test all features

### Final Testing
- [ ] Test voice recording and playback
- [ ] Test text rehearsal
- [ ] Test dialogue generation
- [ ] Test feedback functionality
- [ ] Test navigation between pages

## Troubleshooting

### Common Issues

- **CORS errors:** Update CORS origin in backend with your Vercel domain
- **File upload issues:** Check Railway logs for file system errors
- **Environment variables:** Ensure they're set correctly in Railway dashboard
- **API timeouts:** Increase timeout values for production
- **Build failures:** Check Railway build logs for dependency issues

### Railway Specific

- **Deployment fails:** Check build logs in Railway dashboard
- **Environment variables not working:** Restart deployment after adding variables
- **File system errors:** Ensure temp directory is properly handled
- **Port issues:** Railway automatically sets PORT environment variable

### Vercel Specific

- **Build fails:** Check build logs in Vercel dashboard
- **Environment variables:** Must be prefixed with `REACT_APP_`
- **API calls fail:** Verify `REACT_APP_API_URL` is set correctly

## Support

- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **OpenAI API:** [platform.openai.com/docs](https://platform.openai.com/docs) 