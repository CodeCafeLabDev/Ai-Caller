# Authentication Troubleshooting Guide

## Overview
This guide helps resolve "no token provided" errors and authentication issues across different deployment scenarios.

## Quick Fix Commands

### 1. Setup Environment
```bash
# For localhost development
npm run setup:localhost

# For ngrok development  
npm run setup:ngrok

# For server deployment
npm run setup:server
```

### 2. Restart Services
```bash
# Stop all Node.js processes
taskkill /f /im node.exe

# Start backend server
node server.js

# Start frontend (in new terminal)
npm run dev
```

## Environment Configurations

### Localhost Development
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:5000`
- **Cookie Settings**: `sameSite: 'lax'`
- **CORS**: Same-origin requests

### Ngrok Development
- **Frontend**: `https://your-ngrok-url.ngrok-free.app`
- **Backend**: `http://localhost:5000`
- **Cookie Settings**: `sameSite: 'none', secure: true`
- **CORS**: Cross-origin requests

### Server Deployment
- **Frontend**: `https://aicaller.codecafelab.in`
- **Backend**: `https://aicaller.codecafelab.in`
- **Cookie Settings**: `sameSite: 'none', secure: true`
- **CORS**: Same-origin requests

## Common Issues & Solutions

### Issue 1: "No token provided" Error

**Symptoms:**
- Login appears successful but subsequent requests fail
- Console shows "No token provided" error
- Cookies not being sent with requests

**Solutions:**

1. **Check Environment Configuration:**
   ```bash
   # Verify .env.local exists and has correct API_BASE_URL
   cat .env.local
   ```

2. **Verify Cookie Settings:**
   - Open browser DevTools → Application → Cookies
   - Check if `token` cookie exists
   - Verify cookie domain and path settings

3. **Check CORS Configuration:**
   - Ensure backend CORS allows your frontend origin
   - Verify `credentials: 'include'` in frontend requests

4. **Restart Both Services:**
   ```bash
   # Stop all processes
   taskkill /f /im node.exe
   
   # Start backend
   node server.js
   
   # Start frontend (new terminal)
   npm run dev
   ```

### Issue 2: Login Fails with 404 Error

**Symptoms:**
- Login request returns 404
- Backend server not responding

**Solutions:**

1. **Check Backend Server:**
   ```bash
   # Verify server is running on port 5000
   netstat -an | findstr :5000
   ```

2. **Check API Base URL:**
   - Ensure `NEXT_PUBLIC_API_BASE_URL` points to correct backend
   - For localhost: `http://localhost:5000`
   - For server: `https://aicaller.codecafelab.in`

3. **Test Backend Health:**
   ```bash
   curl http://localhost:5000/api/health
   ```

### Issue 3: Cross-Origin Cookie Issues

**Symptoms:**
- Cookies not being set for ngrok/server deployments
- "No token provided" after successful login

**Solutions:**

1. **Verify Cookie Settings:**
   - For localhost: `sameSite: 'lax'`
   - For cross-origin: `sameSite: 'none', secure: true`

2. **Check HTTPS Requirements:**
   - Cross-origin cookies require HTTPS
   - Ensure ngrok uses HTTPS

3. **Verify CORS Headers:**
   - Backend must include `exposedHeaders: ['Set-Cookie']`
   - Frontend must use `credentials: 'include'`

## Debug Steps

### 1. Check Browser Network Tab
1. Open DevTools → Network
2. Attempt login
3. Check request/response headers
4. Verify cookies are being set

### 2. Check Backend Logs
```bash
# Look for CORS and authentication logs
node server.js
```

### 3. Test API Endpoints
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test login endpoint
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 4. Verify Environment Variables
```bash
# Check if .env.local exists
ls -la .env.local

# View environment configuration
cat .env.local
```

## Environment-Specific Setup

### For Localhost Development
```bash
npm run setup:localhost
# This creates .env.local with:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
# FRONTEND_URL=http://localhost:3000
# NODE_ENV=development
```

### For Ngrok Development
```bash
npm run setup:ngrok
# This creates .env.local with:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
# FRONTEND_URL=http://localhost:3000
# NODE_ENV=development
```

### For Server Deployment
```bash
npm run setup:server
# This creates .env.local with:
# NEXT_PUBLIC_API_BASE_URL=https://aicaller.codecafelab.in
# FRONTEND_URL=https://aicaller.codecafelab.in
# NODE_ENV=production
```

## Verification Checklist

After setup, verify:

- [ ] `.env.local` file exists with correct `NEXT_PUBLIC_API_BASE_URL`
- [ ] Backend server is running on correct port
- [ ] Frontend can access backend (test health endpoint)
- [ ] Login request succeeds (check network tab)
- [ ] Cookie is set after login (check application tab)
- [ ] Subsequent API requests include cookie
- [ ] No CORS errors in console

## Still Having Issues?

1. **Clear Browser Data:**
   - Clear cookies and local storage
   - Try incognito/private mode

2. **Check Firewall/Antivirus:**
   - Ensure port 5000 is not blocked
   - Allow Node.js through firewall

3. **Verify Database Connection:**
   - Check MySQL server is running
   - Verify database credentials

4. **Check for Port Conflicts:**
   ```bash
   # Check what's using port 5000
   netstat -ano | findstr :5000
   ```

## Support

If issues persist:
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a simple curl request to isolate the issue
4. Ensure both frontend and backend are using compatible configurations
