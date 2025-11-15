# Production Setup Guide

This guide covers the essential steps to prepare your VOX Dashboard for production deployment.

## Security Configuration

### 1. Update Restaurant Credentials

**CRITICAL**: Change default passwords before deploying to production!

Edit `src/utils/restaurantConfig.js`:

```javascript
const RESTAURANT_CONFIG = {
  restaurant_a: {
    baseUrl: "https://finlumina-vox-v3.onrender.com",
    username: "restaurant_a",
    password: "USE_STRONG_PASSWORD_HERE", // ⚠️ CHANGE THIS!
  },
  restaurant_b: {
    baseUrl: "https://finlumina-vox-v.onrender.com",
    username: "restaurant_b",
    password: "USE_STRONG_PASSWORD_HERE", // ⚠️ CHANGE THIS!
  },
  database: {
    baseUrl: "https://vox-openai.onrender.com",
    username: "Database",
    password: "USE_STRONG_PASSWORD_HERE", // ⚠️ CHANGE THIS!
  },
  restaurant_c: {
    baseUrl: "https://vox-openai-database.onrender.com",
    username: "normal",
    password: "USE_STRONG_PASSWORD_HERE", // ⚠️ CHANGE THIS!
  },
  demo: {
    baseUrl: "https://vox-openai-demo.onrender.com",
    username: "Demo",
    password: "USE_STRONG_PASSWORD_HERE", // ⚠️ CHANGE THIS!
  },
};
```

### 2. Backend CORS Configuration

Your AI voice agent backend must allow connections from your dashboard URL.

In your backend (Vox-OpenAI-Database), update CORS settings:

```python
# Example for Python/FastAPI backend
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4000",  # Development
        "https://vox-dashboard.onrender.com",  # Production (update with your URL)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. WebSocket Security

Ensure WebSocket endpoints are secure:

- Use `wss://` (secure WebSocket) in production
- Validate authentication tokens
- Implement rate limiting
- Monitor for unusual activity

## Backend Integration

### Connect to Vox-OpenAI-Database

Your dashboard connects to your AI voice agent backend at:
- **Repository**: https://github.com/Finlumina-Test/Vox-OpenAI-Database
- **WebSocket Endpoint**: `wss://your-backend.onrender.com/ws`
- **API Endpoint**: `https://your-backend.onrender.com/api`

### Required Backend Features

Your backend should provide:

1. **WebSocket Connection**
   ```
   wss://backend-url/ws
   ```
   - Real-time call updates
   - Transcript streaming
   - Order data updates

2. **Call Management API**
   ```
   GET  /api/calls/history
   POST /api/calls/save
   POST /api/calls/takeover
   POST /api/calls/end
   ```

3. **Authentication**
   - Restaurant login validation
   - Session management

### WebSocket Message Format

Expected message format from backend:

```javascript
// New call initiated
{
  type: "new_call",
  call_id: "unique-call-id",
  timestamp: "2024-01-15T10:30:00Z"
}

// Transcript update
{
  type: "transcript",
  call_id: "unique-call-id",
  speaker: "customer" | "ai" | "human",
  text: "Customer message here",
  timestamp: "2024-01-15T10:30:05Z"
}

// Order update
{
  type: "order_update",
  call_id: "unique-call-id",
  order_data: {
    items: [...],
    total: 45.99,
    // ... other order fields
  }
}

// Call ended
{
  type: "call_ended",
  call_id: "unique-call-id",
  duration: 125, // seconds
  timestamp: "2024-01-15T10:32:05Z"
}
```

## Environment Setup

### Production Environment Variables

In Render Dashboard, add these environment variables:

```bash
NODE_ENV=production
PORT=4000

# Optional: Add backend URLs as env vars for easier updates
RESTAURANT_A_URL=https://finlumina-vox-v3.onrender.com
RESTAURANT_B_URL=https://finlumina-vox-v.onrender.com
DATABASE_URL=https://vox-openai.onrender.com
```

## Performance Optimization

### 1. Enable Production Build

The build process automatically optimizes:
- ✅ Code minification
- ✅ Tree shaking
- ✅ Asset optimization
- ✅ Code splitting

### 2. Render Service Configuration

**Recommended Settings:**
- **Instance Type**: Starter ($7/month minimum for production)
- **Region**: Choose closest to your users
- **Auto-Deploy**: Enable for automatic updates

**Why paid tier?**
- Free tier sleeps after 15 min inactivity
- 30-second wake-up time is poor UX for real-time calls
- Paid tier = always on = better for production

### 3. WebSocket Optimization

- Keep-alive pings every 30 seconds
- Automatic reconnection on disconnect
- Connection pooling for multiple calls

## Monitoring Setup

### Application Logs

Monitor in Render Dashboard:
1. Go to your service
2. Click "Logs" tab
3. Watch for:
   - WebSocket connection errors
   - Authentication failures
   - Backend connectivity issues

### Key Metrics to Monitor

- **WebSocket Connection Status**: Should stay connected
- **Call Volume**: Number of concurrent calls
- **Error Rate**: Should be < 1%
- **Response Time**: Should be < 500ms

### Alerts (Recommended)

Set up alerts for:
- Service downtime
- High error rate
- WebSocket disconnections
- Memory/CPU spikes

## Testing Before Production

### Pre-Deployment Checklist

- [ ] All passwords changed from defaults
- [ ] Backend URLs updated to production
- [ ] CORS configured on backend
- [ ] WebSocket connection tested
- [ ] Login works for all restaurants
- [ ] Live call monitoring works
- [ ] Call takeover functionality works
- [ ] Order tracking works
- [ ] History search works
- [ ] Mobile view tested
- [ ] Multiple concurrent calls tested
- [ ] Audio streaming works
- [ ] Demo mode works

### Test Procedure

1. **Deploy to staging first**
   ```bash
   # Create a staging branch
   git checkout -b staging
   git push origin staging

   # Deploy to Render as "vox-dashboard-staging"
   ```

2. **Test all features**
   - Login with each restaurant
   - Initiate test calls
   - Verify transcripts appear
   - Test call takeover
   - Check order tracking
   - Search call history

3. **Load testing** (optional but recommended)
   - Simulate multiple concurrent calls
   - Monitor performance
   - Check for memory leaks

4. **Deploy to production**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

## Backup and Recovery

### Database Backups

If using a database:
- Enable automatic backups in Render
- Test restore procedure
- Document recovery steps

### Configuration Backups

Keep copies of:
- Restaurant configurations
- Environment variables
- Deployment settings

## Support Contacts

### In Case of Issues

1. **Backend Issues**: Check Vox-OpenAI-Database repository
2. **Deployment Issues**: Render support
3. **Dashboard Issues**: Check application logs

### Emergency Procedures

If dashboard goes down:
1. Check Render service status
2. View logs for errors
3. Restart service if needed
4. Roll back to previous version if critical

## Cost Estimation

### Render Costs (Monthly)

- **Development/Testing**: $0 (Free tier)
- **Production (Small)**: $7 (Starter tier, 1 service)
- **Production (Medium)**: $14 (Multiple services or scaled)

### Backend Costs

Your AI voice agent backend also needs hosting:
- **Backend Service**: $7-25/month (depending on traffic)
- **Database** (if separate): $7+/month

**Total Estimated**: $14-50/month for full production stack

## Maintenance

### Regular Tasks

**Weekly**:
- Check error logs
- Monitor performance metrics
- Verify WebSocket connections

**Monthly**:
- Review and update dependencies
- Security audit
- Performance optimization

**Quarterly**:
- Update passwords
- Review access controls
- Test disaster recovery

## Scaling Considerations

### When to Scale Up

Scale when you experience:
- Response time > 1 second
- Memory usage > 80%
- CPU usage > 80%
- Multiple concurrent calls dropping

### Scaling Options

1. **Vertical Scaling**: Upgrade instance size in Render
2. **Horizontal Scaling**: Multiple dashboard instances (requires load balancer)
3. **Backend Scaling**: Scale your AI voice agent backend separately

## Security Best Practices

### Production Checklist

- [ ] HTTPS enabled (automatic with Render)
- [ ] Strong passwords (min 16 chars, random)
- [ ] CORS properly configured
- [ ] No credentials in git repository
- [ ] Environment variables for sensitive data
- [ ] Regular security updates
- [ ] Access logs enabled
- [ ] Rate limiting on backend
- [ ] Session timeout configured

### Compliance

If handling customer data:
- Review GDPR requirements
- Implement data retention policy
- Add privacy policy
- Secure customer recordings
- Implement audit logging

## Troubleshooting Common Issues

### WebSocket Won't Connect

```bash
# Check:
1. Backend URL correct? (should start with https:// or wss://)
2. Backend running? (check Render logs)
3. CORS configured? (check backend settings)
4. Firewall blocking? (check network)

# Test WebSocket manually:
wscat -c wss://your-backend.onrender.com/ws
```

### Slow Performance

```bash
# Solutions:
1. Upgrade from free tier to paid
2. Enable caching
3. Optimize WebSocket messages
4. Check backend performance
5. Choose closer region
```

### High Memory Usage

```bash
# Solutions:
1. Check for memory leaks
2. Optimize state management
3. Limit concurrent calls
4. Upgrade instance
```

---

## Quick Start Production Deployment

```bash
# 1. Update credentials
nano web/src/utils/restaurantConfig.js

# 2. Commit changes
git add .
git commit -m "Update production credentials"
git push origin main

# 3. Deploy to Render
# - Go to dashboard.render.com
# - Create new web service
# - Connect repository
# - Render will auto-deploy

# 4. Test deployment
curl https://your-service.onrender.com

# 5. Test WebSocket
# Open dashboard in browser and check console
```

---

**Ready to deploy?** Follow the [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) guide! 🚀
