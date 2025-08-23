#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Server Deployment Environment');
console.log('===========================================\n');

const envContent = `# API Configuration for Server Deployment
# Frontend on localhost, Backend on server
NEXT_PUBLIC_API_BASE_URL=https://aicaller.codecafelab.in
FRONTEND_URL=http://localhost:3000

# Additional configuration
NODE_ENV=development
`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file with server deployment configuration');
  console.log('');
  console.log('📋 Configuration:');
  console.log('- Frontend: http://localhost:3000');
  console.log('- Backend: https://aicaller.codecafelab.in');
  console.log('');
  console.log('🔄 Next Steps:');
  console.log('1. Restart your Next.js development server: npm run dev');
  console.log('2. Make sure your backend server is running on the server');
  console.log('3. Try logging in - should work without 404 errors');
  console.log('');
  console.log('🔍 To verify setup:');
  console.log('- Check browser console for API configuration debug info');
  console.log('- Try logging in with valid credentials');
  console.log('- Should see successful login without "No token provided" error');
} catch (error) {
  console.error('❌ Error creating .env.local file:', error.message);
  console.log('');
  console.log('📝 Manual Setup:');
  console.log('Create a .env.local file in your project root with:');
  console.log(envContent);
}
