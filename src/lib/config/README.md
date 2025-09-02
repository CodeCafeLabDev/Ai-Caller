# Centralized URL Configuration

This directory contains centralized configuration files for all base URLs and API endpoints used across the application.

## Files

- `urls.ts` - Frontend URL configuration
- `urls.js` - Backend URL configuration (Node.js)

## Usage

### Frontend (TypeScript)

```typescript
import { config, urls } from '@/lib/config/urls';

// Access configuration values
const backendUrl = config.backend.base; // http://localhost:5000
const elevenlabsUrl = config.elevenlabs.base; // https://api.elevenlabs.io/v1

// Use helper functions to build URLs
const agentUrl = urls.elevenlabs.agent('agent_123'); // https://api.elevenlabs.io/v1/convai/agents/agent_123
const apiEndpoint = urls.backend.api('/clients'); // http://localhost:5000/api/clients
```

### Backend (Node.js)

```javascript
const { config, urls } = require('./config/urls');

// Access configuration values
const backendUrl = config.backend.base; // http://localhost:5000
const elevenlabsUrl = config.elevenlabs.base; // https://api.elevenlabs.io/v1

// Use helper functions to build URLs
const agentUrl = urls.elevenlabs.agent('agent_123'); // https://api.elevenlabs.io/v1/convai/agents/agent_123
const apiEndpoint = urls.backend.api('/clients'); // http://localhost:5000/api/clients
```

## Configuration Structure

### ElevenLabs API
- `config.elevenlabs.base` - Base URL for ElevenLabs API
- `config.elevenlabs.convai.*` - ConvAI-specific endpoints
- `config.elevenlabs.legacy.*` - Legacy API endpoints

### Backend
- `config.backend.base` - Backend server URL
- `config.backend.api` - Backend API base URL

### Frontend
- `config.frontend.base` - Frontend application URL

### Environment
- `config.env.isDevelopment` - Development environment flag
- `config.env.isProduction` - Production environment flag
- `config.env.isTest` - Test environment flag

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### Backend (.env)
```bash
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ai_caller
DB_USER=root
DB_PASSWORD=
```

## Benefits

1. **Single Source of Truth** - All URLs defined in one place
2. **Easy Maintenance** - Change URLs once, updates everywhere
3. **Environment Flexibility** - Different URLs for dev/staging/prod
4. **Type Safety** - TypeScript support for frontend
5. **Consistency** - Same structure across frontend and backend

## Migration Guide

When migrating existing code:

1. **Replace hardcoded URLs** with configuration values
2. **Use helper functions** for dynamic URL building
3. **Update imports** to use centralized config
4. **Test thoroughly** to ensure all endpoints work

## Example Migration

### Before
```typescript
const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/123');
```

### After
```typescript
import { urls } from '@/lib/config/urls';
const response = await fetch(urls.elevenlabs.agent('123'));
```
