# Ngrok Setup Guide

This guide will help you resolve the "Failed to fetch" error when using ngrok with your AI Caller application.

## The Problem

When you access your application through ngrok (e.g., `https://52ef989029cd.ngrok-free.app`), the frontend tries to make API calls to `http://localhost:5000`, which causes CORS errors because the browser is running on a different domain.

## Solutions

### Solution 1: Automatic Setup (Recommended)

1. **Run the setup script** with your ngrok URL:
   ```bash
   npm run setup-ngrok https://52ef989029cd.ngrok-free.app
   ```

2. **Restart your Next.js development server**:
   ```bash
   npm run dev
   ```

### Solution 2: Manual Setup

1. **Create a `.env.local` file** in your project root:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://52ef989029cd.ngrok-free.app
   ```

2. **Restart your Next.js development server**:
   ```bash
   npm run dev
   ```

### Solution 3: Dynamic Detection (Already Implemented)

The application now automatically detects ngrok URLs and adjusts the API base URL accordingly. This should work without any additional configuration.

## What We Fixed

1. **Updated CORS configuration** in `server.js` to allow ngrok domains
2. **Enhanced API configuration** to automatically detect ngrok URLs
3. **Added Next.js headers** for better CORS handling
4. **Created helper scripts** for easy ngrok setup

## Verification

After applying the fix:

1. Your ngrok URL should work without "Failed to fetch" errors
2. Login should work properly
3. All API calls should go through successfully

## Troubleshooting

If you still encounter issues:

1. **Check your ngrok URL** - Make sure it's the correct one
2. **Restart both servers** - Stop and restart both your Next.js and Express servers
3. **Clear browser cache** - Hard refresh (Ctrl+F5) or clear browser cache
4. **Check ngrok status** - Ensure your ngrok tunnel is active and accessible

## Environment Variables

The application uses these environment variables:

- `NEXT_PUBLIC_API_BASE_URL` - Sets the API base URL for the frontend
- If not set, it automatically detects ngrok URLs in development

## Notes

- This setup is for development only
- For production, use proper domain names and SSL certificates
- The automatic detection only works in development mode 