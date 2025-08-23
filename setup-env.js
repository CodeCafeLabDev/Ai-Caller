#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 AI Caller Environment Setup');
console.log('==============================\n');

const scenarios = {
  localhost: {
    name: 'Localhost Development',
    description: 'Frontend on localhost:3000, Backend on localhost:5000',
    config: {
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:5000',
      FRONTEND_URL: 'http://localhost:3000'
    }
  },
  ngrok: {
    name: 'Ngrok Tunnel',
    description: 'Frontend and Backend accessible via ngrok tunnel',
    config: {
      NEXT_PUBLIC_API_BASE_URL: 'https://your-ngrok-url.ngrok-free.app',
      FRONTEND_URL: 'https://your-ngrok-url.ngrok-free.app'
    }
  },
  server: {
    name: 'Server Deployment',
    description: 'Frontend on localhost, Backend on server',
    config: {
      NEXT_PUBLIC_API_BASE_URL: 'https://aicaller.codecafelab.in',
      FRONTEND_URL: 'http://localhost:3000'
    }
  }
};

console.log('Available scenarios:');
Object.entries(scenarios).forEach(([key, scenario], index) => {
  console.log(`${index + 1}. ${scenario.name}`);
  console.log(`   ${scenario.description}`);
  console.log('');
});

console.log('To set up your environment:');
console.log('1. Choose your scenario from above');
console.log('2. Create a .env.local file in your project root with the following content:\n');

Object.entries(scenarios).forEach(([key, scenario]) => {
  console.log(`=== ${scenario.name} ===`);
  console.log('# API Configuration');
  Object.entries(scenario.config).forEach(([envVar, value]) => {
    console.log(`${envVar}=${value}`);
  });
  console.log('');
});

console.log('📝 Instructions:');
console.log('1. Create a .env.local file in your project root');
console.log('2. Copy the appropriate configuration above');
console.log('3. Replace "your-ngrok-url" with your actual ngrok URL if using ngrok');
console.log('4. Restart your Next.js development server');
console.log('5. Make sure your backend server is running');

console.log('\n🔧 Additional Notes:');
console.log('- For ngrok: Use the setup-ngrok.js script to automatically configure');
console.log('- For server deployment: Make sure your backend is running on the server');
console.log('- For localhost: Make sure both frontend and backend are running locally');

console.log('\n✅ After setup, your project will work with:');
console.log('- Localhost development (localhost:3000 → localhost:5000)');
console.log('- Ngrok tunnels (automatic detection)');
console.log('- Server deployment (localhost:3000 → server backend)');
