# AI Caller Deployment Guide

This guide explains how to set up the AI Caller project for different deployment scenarios.

## 🚀 Available Deployment Scenarios

### 1. Localhost Development
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:5000`
- **Use Case**: Local development and testing

### 2. Ngrok Tunnel
- **Frontend & Backend**: Accessible via ngrok tunnel URL
- **Use Case**: Sharing with clients, testing on mobile devices, external access

### 3. Server Deployment
- **Frontend**: `http://localhost:3000` (or any domain)
- **Backend**: `https://aicaller.codecafelab.in`
- **Use Case**: Production deployment with separate frontend and backend

## 📋 Setup Instructions

### Step 1: Choose Your Scenario

Run the setup script to see all available configurations:
```bash
node setup-env.js
```

### Step 2: Create Environment File

Create a `.env.local` file in your project root with the appropriate configuration:

#### For Localhost Development:
```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

#### For Ngrok Tunnel:
```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-ngrok-url.ngrok-free.app
FRONTEND_URL=https://your-ngrok-url.ngrok-free.app
```

#### For Server Deployment:
```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://aicaller.codecafelab.in
FRONTEND_URL=http://localhost:3000
```

### Step 3: Start Your Services

#### Backend Server
```bash
# Start the backend server
node server.js
```

#### Frontend Development Server
```bash
# Start the Next.js development server
npm run dev
```

## 🔧 Troubleshooting

### "404 Server Error" on Localhost
**Problem**: Frontend can't connect to backend
**Solution**: 
1. Make sure your `.env.local` file has the correct `NEXT_PUBLIC_API_BASE_URL`
2. Ensure the backend server is running on the correct port
3. Check that the backend URL is accessible

### "No Token Provided" Error
**Problem**: Authentication token not being set properly
**Solution**:
1. The cookie settings have been updated to work across domains
2. Make sure you're using HTTPS for ngrok and server deployments
3. Check browser console for any CORS errors

### CORS Errors
**Problem**: Cross-origin requests being blocked
**Solution**:
1. The server CORS configuration has been updated to allow all necessary domains
2. Make sure your frontend URL is included in the CORS origins
3. Check that credentials are being sent with requests

## 🌐 Domain-Specific Setup

### Ngrok Setup
If you're using ngrok, you can use the automatic setup script:
```bash
node setup-ngrok.js
```

This will:
1. Start an ngrok tunnel
2. Create the appropriate `.env.local` file
3. Configure the environment automatically

### Server Deployment
For server deployment:
1. Make sure your backend is running on the server
2. Set `NEXT_PUBLIC_API_BASE_URL` to your server's backend URL
3. Ensure your server's firewall allows connections on the backend port

## 🔍 Debug Information

The application includes debug logging to help troubleshoot connection issues. Check the browser console for:
- API configuration details
- Current environment variables
- Final API base URL being used

## ✅ Verification

To verify your setup is working:

1. **Check Backend**: Visit `http://localhost:5000` (or your server URL) - should show server running message
2. **Check Frontend**: Visit `http://localhost:3000` - should load the application
3. **Test Login**: Try logging in - should work without 404 or token errors
4. **Check Console**: Look for the debug information in browser console

## 🚨 Important Notes

- **HTTPS Required**: For ngrok and server deployments, HTTPS is required for cookies to work properly
- **Environment Variables**: Always restart your development server after changing `.env.local`
- **CORS**: The server is configured to allow all common development domains
- **Cookies**: Updated to use `sameSite: 'none'` and `secure: true` for cross-domain compatibility

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your environment configuration
3. Ensure both frontend and backend are running
4. Check that the backend URL is accessible from your frontend
