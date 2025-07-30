#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get ngrok URL from command line argument
const ngrokUrl = process.argv[2];

if (!ngrokUrl) {
  console.log('❌ Please provide your ngrok URL as an argument');
  console.log('Usage: node setup-ngrok.js https://your-ngrok-url.ngrok-free.app');
  process.exit(1);
}

// Validate ngrok URL format
if (!ngrokUrl.includes('ngrok')) {
  console.log('❌ Please provide a valid ngrok URL');
  process.exit(1);
}

// Create .env.local file content
const envContent = `# API Configuration for ngrok development
NEXT_PUBLIC_API_BASE_URL=${ngrokUrl}
`;

// Write to .env.local
const envPath = path.join(__dirname, '.env.local');
fs.writeFileSync(envPath, envContent);

console.log('✅ Created .env.local with ngrok configuration');
console.log(`📝 NEXT_PUBLIC_API_BASE_URL=${ngrokUrl}`);
console.log('');
console.log('🔄 Please restart your Next.js development server for changes to take effect');
console.log('   npm run dev'); 