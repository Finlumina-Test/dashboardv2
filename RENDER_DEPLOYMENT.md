# Deploying VOX Dashboard to Render

This guide will help you deploy the VOX Dashboard to Render.com for production use with your AI voice agent backend.

## Prerequisites

- GitHub account with access to this repository
- Render.com account (free or paid)
- Your AI voice agent backend URLs (from Vox-OpenAI-Database repo)

## Deployment Methods

### Method 1: Automatic Deployment (Recommended)

1. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Blueprint"
   - Connect your GitHub account if not already connected
   - Select this repository: `Finlumina-Test/dashboardv2`
   - Render will automatically detect the `render.yaml` file

2. **Configure Environment**
   - Render will use the configuration from `render.yaml`
   - Service will be created automatically
   - Click "Apply" to deploy

3. **Update Restaurant Configuration**
   - After deployment, you'll need to update the restaurant backend URLs
   - See "Configuration" section below

### Method 2: Manual Deployment

1. **Create New Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `Finlumina-Test/dashboardv2`

2. **Configure Build Settings**
   ```
   Name: vox-dashboard (or your preferred name)
   Region: Oregon (or your preferred region)
   Branch: main (or your production branch)
   Root Directory: web
   Runtime: Node
   Build Command: npm install --legacy-peer-deps && npm run build
   Start Command: npm run start
   ```

3. **Environment Variables**
   Add these in the "Environment" section:
   ```
   NODE_ENV=production
   PORT=4000
   ```

4. **Advanced Settings**
   ```
   Health Check Path: /
   Auto-Deploy: Yes
   ```

5. **Click "Create Web Service"**

## Configuration

### Update Restaurant Backend URLs

After deployment, update `web/src/utils/restaurantConfig.js` with your production backend URLs:

```javascript
const RESTAURANT_CONFIG = {
  restaurant_a: {
    baseUrl: "https://your-backend-a.onrender.com",
    username: "restaurant_a",
    password: "your-secure-password",
  },
  restaurant_b: {
    baseUrl: "https://your-backend-b.onrender.com",
    username: "restaurant_b",
    password: "your-secure-password",
  },
  database: {
    baseUrl: "https://vox-openai.onrender.com",
    username: "Database",
    password: "your-secure-password",
  },
};
```

**Important Security Notes:**
1. Change default passwords before deploying
2. Consider moving credentials to environment variables
3. Ensure your backend allows CORS from your dashboard URL

### Environment Variables (Optional but Recommended)

For better security, you can use environment variables:

1. In Render Dashboard, go to your service
2. Click "Environment" tab
3. Add these variables:
   ```
   RESTAURANT_A_URL=https://your-backend-a.onrender.com
   RESTAURANT_A_USER=restaurant_a
   RESTAURANT_A_PASS=your-secure-password

   RESTAURANT_B_URL=https://your-backend-b.onrender.com
   RESTAURANT_B_USER=restaurant_b
   RESTAURANT_B_PASS=your-secure-password

   DATABASE_URL=https://vox-openai.onrender.com
   DATABASE_USER=Database
   DATABASE_PASS=your-secure-password
   ```

4. Update `restaurantConfig.js` to read from environment:
   ```javascript
   const RESTAURANT_CONFIG = {
     restaurant_a: {
       baseUrl: process.env.RESTAURANT_A_URL || "https://default-url.com",
       username: process.env.RESTAURANT_A_USER || "restaurant_a",
       password: process.env.RESTAURANT_A_PASS || "default-pass",
     },
     // ... etc
   };
   ```

## Backend Integration

### WebSocket Configuration

Your dashboard connects to the AI voice agent backend via WebSocket. Ensure:

1. **Backend CORS Settings**
   - Your backend must allow connections from your Render dashboard URL
   - Example: `https://vox-dashboard.onrender.com`

2. **WebSocket Endpoint**
   - The dashboard connects to: `wss://your-backend.onrender.com/ws`
   - Ensure your backend WebSocket server is running

3. **Backend Health**
   - Render free tier services sleep after inactivity
   - Consider using a paid plan or wake-up pings for production

### Testing Backend Connection

After deployment:

1. Open browser console on your dashboard
2. Look for WebSocket connection logs
3. Should see: `WebSocket connected to wss://...`
4. If errors, check:
   - Backend URL is correct
   - Backend is running
   - CORS is configured properly
   - No firewall blocking WebSocket connections

## Deployment Process

When you push to your repository:

1. Render automatically detects changes
2. Runs build command: `npm install --legacy-peer-deps && npm run build`
3. Compiles React application
4. Starts server: `npm run start`
5. Service becomes available at: `https://your-service-name.onrender.com`

### Build Time

- First build: ~5-10 minutes
- Subsequent builds: ~3-5 minutes
- Render caches `node_modules` for faster builds

## Custom Domain (Optional)

1. Go to your service in Render Dashboard
2. Click "Settings" → "Custom Domain"
3. Add your domain (e.g., `dashboard.yourdomain.com`)
4. Update DNS records as instructed by Render
5. Render provides free SSL certificate

## Monitoring

### View Logs

1. Go to your service in Render Dashboard
2. Click "Logs" tab
3. View real-time application logs
4. Use for debugging connection issues

### Metrics

1. Click "Metrics" tab
2. View:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

## Scaling

### Free Tier
- 750 hours/month free
- Service sleeps after 15 minutes of inactivity
- Wake-up time: ~30 seconds

### Paid Plans (Starter $7/month)
- Always on
- No sleep
- Better for production
- Faster performance

## Troubleshooting

### Build Fails

**Error: peer dependency conflicts**
```bash
Solution: Ensure build command uses --legacy-peer-deps flag
Build Command: npm install --legacy-peer-deps && npm run build
```

**Error: Out of memory**
```bash
Solution: Upgrade to larger instance or optimize build
- Remove unused dependencies
- Consider using pnpm instead of npm
```

### Runtime Errors

**WebSocket connection failed**
```bash
1. Check backend URL in restaurantConfig.js
2. Verify backend is running
3. Check CORS settings on backend
4. View logs for detailed error
```

**Application won't start**
```bash
1. Check logs in Render Dashboard
2. Verify start command: npm run start
3. Ensure build completed successfully
4. Check for missing environment variables
```

### Performance Issues

**Slow response times**
```bash
1. Upgrade from free tier to paid
2. Choose region closer to users
3. Check backend performance
4. Optimize WebSocket connections
```

## Production Checklist

Before going live:

- [ ] Update all backend URLs to production endpoints
- [ ] Change all default passwords
- [ ] Configure CORS on backend for dashboard URL
- [ ] Test login with all restaurant credentials
- [ ] Test WebSocket connection to backend
- [ ] Verify audio streaming works
- [ ] Test call takeover functionality
- [ ] Check mobile responsiveness
- [ ] Set up custom domain (optional)
- [ ] Enable monitoring/alerting
- [ ] Document credentials securely
- [ ] Test demo mode
- [ ] Verify all views (Dashboard, POS, Live, History)

## Support

### Render Support
- Documentation: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

### Dashboard Issues
- Check application logs in Render
- Review browser console for errors
- Verify backend connectivity

## Cost Optimization

### Free Tier Strategy
- Use free tier for development/staging
- Backend and frontend can both use free tier
- Total: $0/month (with sleep limitations)

### Production Strategy
- Starter plan ($7/month) for always-on dashboard
- Consider reserved instances for predictable traffic
- Monitor usage to optimize costs

### Estimated Costs
- **Development**: Free
- **Small Production**: $7/month (Starter tier)
- **Medium Production**: $25/month (Standard tier)
- **Large Production**: Custom pricing

## Next Steps

1. Deploy using one of the methods above
2. Update restaurant configurations
3. Test all functionality
4. Monitor initial performance
5. Set up custom domain if needed
6. Configure production backend URLs
7. Update security credentials

---

## Quick Deploy Commands

If deploying via Render API or CLI:

```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# Deploy
render deploy
```

---

**Your dashboard will be live at**: `https://your-service-name.onrender.com`

Good luck with your deployment! 🚀
