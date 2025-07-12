# API Configuration System

This document describes the centralized API configuration system for the AI Caller project.

## Overview

The API configuration system centralizes all API endpoints and provides a consistent interface for making HTTP requests throughout the application. This makes it easy to:

- Change API base URLs for different environments
- Maintain consistent request patterns
- Add authentication headers automatically
- Handle external API integrations

## File Structure

```
src/lib/
├── apiConfig.ts          # Main API configuration file
└── README_API_CONFIG.md  # This documentation
```

## Configuration

### Base URLs

The system automatically detects the environment and uses appropriate base URLs:

- **Development**: `http://localhost:5000`
- **Production**: Uses `NEXT_PUBLIC_API_BASE_URL` environment variable or defaults to `https://api.aicaller.com`

### Environment Variables

Add these to your `.env.local` file:

```env
# For production
NEXT_PUBLIC_API_BASE_URL=https://api.aicaller.com
```

## Usage

### Basic Import

```typescript
import { api, API_BASE_URL, apiUtils } from '@/lib/apiConfig';
```

### Making API Calls

#### Using the `api` object (Recommended)

```typescript
// GET requests
const users = await api.getAdminUsers();
const user = await api.getAdminUser('123');

// POST requests
const newUser = await api.createAdminUser({
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT requests
const updatedUser = await api.updateAdminUser('123', {
  name: 'Jane Doe'
});

// DELETE requests
await api.deleteAdminUser('123');
```

#### Using `apiUtils` for custom requests

```typescript
// Custom GET request
const response = await apiUtils.get('/api/custom-endpoint');

// Custom POST request with data
const response = await apiUtils.post('/api/custom-endpoint', {
  key: 'value'
});

// File upload
const formData = new FormData();
formData.append('file', file);
const response = await apiUtils.upload('/api/upload', formData);
```

#### Using `API_BASE_URL` for direct URLs

```typescript
import { API_BASE_URL } from '@/lib/apiConfig';

const imageUrl = `${API_BASE_URL}/uploads/image.jpg`;
```

### External APIs

For external API integrations (like ElevenLabs):

```typescript
// With API key
const models = await api.elevenLabs.getModels('your-api-key');
const voices = await api.elevenLabs.getVoices('your-api-key');

// Without API key (for public endpoints)
const models = await api.elevenLabs.getModels();
```

## Available API Functions

### Authentication
- `api.login(data)` - User login

### Admin Users
- `api.getCurrentUser()` - Get current user profile
- `api.getAdminUsers()` - Get all admin users
- `api.getAdminUser(userId)` - Get specific admin user
- `api.createAdminUser(data)` - Create new admin user
- `api.updateAdminUser(userId, data)` - Update admin user
- `api.deleteAdminUser(userId)` - Delete admin user
- `api.resetAdminUserPassword(userId)` - Reset user password
- `api.forceLogoutUser(userId)` - Force user logout
- `api.getUserActivity(userId)` - Get user activity

### Admin Roles
- `api.getAdminRoles()` - Get all admin roles
- `api.getAdminRole(roleId)` - Get specific admin role
- `api.createAdminRole(data)` - Create new admin role
- `api.updateAdminRole(roleId, data)` - Update admin role
- `api.deleteAdminRole(roleId)` - Delete admin role

### User Roles
- `api.getUserRoles()` - Get all user roles
- `api.getUserRole(roleId)` - Get specific user role
- `api.createUserRole(data)` - Create new user role
- `api.updateUserRole(roleId, data)` - Update user role

### Client Users
- `api.getClientUsers()` - Get all client users
- `api.getClientUser(userId)` - Get specific client user
- `api.createClientUser(data)` - Create new client user
- `api.updateClientUser(userId, data)` - Update client user
- `api.deleteClientUser(userId)` - Delete client user
- `api.resetClientUserPassword(userId)` - Reset client user password

### Clients
- `api.getClients()` - Get all clients
- `api.getClient(clientId)` - Get specific client
- `api.createClient(data)` - Create new client
- `api.updateClient(clientId, data)` - Update client

### Plans
- `api.getPlans()` - Get all plans
- `api.getPlan(planId)` - Get specific plan
- `api.createPlan(data)` - Create new plan
- `api.updatePlan(planId, data)` - Update plan
- `api.deletePlan(planId)` - Delete plan

### Assigned Plans
- `api.getAssignedPlans()` - Get all assigned plans
- `api.assignPlan(data)` - Assign plan to client

### Knowledge Base
- `api.getKnowledgeBase()` - Get all knowledge base items
- `api.createKnowledgeBaseItem(data)` - Create new knowledge base item
- `api.deleteKnowledgeBaseItem(id)` - Delete knowledge base item

### Upload
- `api.uploadFile(formData)` - Upload file

### Languages
- `api.getLanguages()` - Get all languages
- `api.createLanguage(data)` - Create new language
- `api.updateLanguage(id, data)` - Update language
- `api.deleteLanguage(id)` - Delete language

### Voices
- `api.getVoices()` - Get all voices

### External APIs

#### ElevenLabs
- `api.elevenLabs.getModels(apiKey?)` - Get ElevenLabs models
- `api.elevenLabs.getUserSubscription(apiKey?)` - Get user subscription
- `api.elevenLabs.getUser(apiKey?)` - Get user info
- `api.elevenLabs.getVoices(apiKey?)` - Get voices

## Default Request Options

All API requests automatically include:

```typescript
{
  credentials: 'include',  // Include cookies
  headers: {
    'Content-Type': 'application/json'
  }
}
```

## Error Handling

All API functions return standard `Response` objects, so you can handle errors like this:

```typescript
try {
  const response = await api.getAdminUsers();
  if (response.ok) {
    const data = await response.json();
    // Handle success
  } else {
    // Handle error
    console.error('API error:', response.status);
  }
} catch (error) {
  // Handle network errors
  console.error('Network error:', error);
}
```

## Migration Guide

### Before (Old way)
```typescript
const response = await fetch('http://localhost:5000/api/admin_users', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### After (New way)
```typescript
import { api } from '@/lib/apiConfig';

const response = await api.getAdminUsers();
```

## Benefits

1. **Centralized Configuration**: All API endpoints are defined in one place
2. **Environment Support**: Automatic switching between development and production URLs
3. **Consistent Interface**: All API calls follow the same pattern
4. **Type Safety**: TypeScript support for better development experience
5. **Easy Maintenance**: Change API endpoints in one place
6. **Authentication**: Automatic inclusion of credentials and headers
7. **External API Support**: Built-in support for third-party APIs

## Adding New Endpoints

To add a new API endpoint:

1. Add the endpoint to `API_ENDPOINTS` in `apiConfig.ts`
2. Add the corresponding function to the `api` object
3. Update this documentation

Example:

```typescript
// In API_ENDPOINTS
NEW_FEATURE: {
  BASE: '/api/new-feature',
  BY_ID: (id: string) => `/api/new-feature/${id}`,
},

// In api object
getNewFeatures: () => apiUtils.get(API_ENDPOINTS.NEW_FEATURE.BASE),
getNewFeature: (id: string) => apiUtils.get(API_ENDPOINTS.NEW_FEATURE.BY_ID(id)),
createNewFeature: (data: any) => apiUtils.post(API_ENDPOINTS.NEW_FEATURE.BASE, data),
```

## Troubleshooting

### Common Issues

1. **Import Error**: Make sure you're importing from `@/lib/apiConfig`
2. **TypeScript Errors**: Check that the function parameters match the expected types
3. **Network Errors**: Verify the API server is running and accessible
4. **Authentication Issues**: Ensure cookies are being sent with requests

### Debug Mode

To debug API calls, you can add logging:

```typescript
const response = await api.getAdminUsers();
console.log('Response status:', response.status);
console.log('Response headers:', response.headers);
const data = await response.json();
console.log('Response data:', data);
``` 