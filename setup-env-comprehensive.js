const fs = require('fs');
const path = require('path');

console.log('🔧 AI Caller Environment Setup Tool');
console.log('====================================');

const scenarios = {
  localhost: {
    name: 'Localhost Development',
    description: 'Frontend on localhost:3000, Backend on localhost:5000',
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:5000',
      FRONTEND_URL: 'http://localhost:3000',
      NODE_ENV: 'development'
    }
  },
  ngrok: {
    name: 'Ngrok Development',
    description: 'Frontend exposed via ngrok, Backend on localhost:5000',
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:5000',
      FRONTEND_URL: 'http://localhost:3000',
      NODE_ENV: 'development'
    }
  },
  server: {
    name: 'Server Deployment',
    description: 'Both frontend and backend on server',
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'https://aicaller.codecafelab.in',
      FRONTEND_URL: 'https://aicaller.codecafelab.in',
      NODE_ENV: 'production'
    }
  }
};

function createEnvFile(scenario) {
  const envContent = `# AI Caller Environment Configuration
# Generated for: ${scenario.name}
# Description: ${scenario.description}

# API Configuration
NEXT_PUBLIC_API_BASE_URL=${scenario.env.NEXT_PUBLIC_API_BASE_URL}

# Frontend URL (for server-side operations)
FRONTEND_URL=${scenario.env.FRONTEND_URL}

# Environment
NODE_ENV=${scenario.env.NODE_ENV}

# ElevenLabs API Key (from firebase.env)
NEXT_PUBLIC_ELEVENLABS_API_KEY=sk_ab0b50095e39acea120f1e10a18f98439d9891f51fa5d317

# Database Configuration (if needed)
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=
# DB_NAME=ai-caller
# JWT_SECRET=your-very-secret-key
`;

  const envPath = path.join(__dirname, '.env.local');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Created .env.local for ${scenario.name}`);
    console.log(`📁 File location: ${envPath}`);
    console.log(`🔗 API Base URL: ${scenario.env.NEXT_PUBLIC_API_BASE_URL}`);
    console.log(`🌐 Frontend URL: ${scenario.env.FRONTEND_URL}`);
    console.log(`⚙️  Environment: ${scenario.env.NODE_ENV}`);
  } catch (error) {
    console.error('❌ Error creating .env.local:', error.message);
  }
}

function showMenu() {
  console.log('\n📋 Available Setup Options:');
  console.log('1. Localhost Development');
  console.log('2. Ngrok Development');
  console.log('3. Server Deployment');
  console.log('4. Show current configuration');
  console.log('5. Exit');
}

function showCurrentConfig() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('\n📄 Current .env.local content:');
    console.log('================================');
    const content = fs.readFileSync(envPath, 'utf8');
    console.log(content);
  } else {
    console.log('\n❌ No .env.local file found');
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const scenario = args[0].toLowerCase();
    if (scenarios[scenario]) {
      createEnvFile(scenarios[scenario]);
      return;
    } else {
      console.log('❌ Invalid scenario. Available options: localhost, ngrok, server');
      return;
    }
  }

  console.log('\n🚀 Quick Setup Commands:');
  console.log('npm run setup:localhost  - Setup for localhost development');
  console.log('npm run setup:ngrok      - Setup for ngrok development');
  console.log('npm run setup:server     - Setup for server deployment');
  console.log('npm run setup:menu       - Interactive menu');
  
  console.log('\n📝 Manual Setup:');
  console.log('node setup-env-comprehensive.js localhost');
  console.log('node setup-env-comprehensive.js ngrok');
  console.log('node setup-env-comprehensive.js server');
}

main();
