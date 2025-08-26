// API Configuration for AI Caller Project
// This file centralizes all API endpoints and base URLs

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Base URLs
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (isDevelopment 
  ? (typeof window !== 'undefined' && (window.location.hostname.includes('ngrok') || window.location.hostname.includes('devtunnels') || window.location.hostname.includes('tunnel'))
     ? 'http://localhost:5000'  // Always use localhost:5000 for backend, even with ngrok frontend
     : 'http://localhost:5000')
  : 'https://aicaller.codecafelab.in');
// Use NEXT_PUBLIC_API_BASE_URL if set, otherwise fallback to localhost:5000 (dev) or prod URL
// For ngrok/tunnel development, always use localhost:5000 for backend API calls

export const EXTERNAL_APIS = {
  ELEVENLABS: {
    BASE_URL: 'https://api.elevenlabs.io/v1',
    ENDPOINTS: {
      MODELS: '/models',
      USER_SUBSCRIPTION: '/user/subscription',
      USER: '/user',
      VOICES: '/voices'
    }
  }
};

// Internal API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/login',
    LOGOUT: '/api/logout',
  },

  // Admin Users
  ADMIN_USERS: {
    BASE: '/api/admin_users',
    ME: '/api/admin_users/me',
    AVATAR_URL: '/api/admin_users/me/avatar_url',
    PROFILE_PICTURE: '/api/admin_users/me/profile-picture',
    RESET_PASSWORD: (userId: string) => `/api/admin_users/${userId}/reset-password`,
    FORCE_LOGOUT: (userId: string) => `/api/admin_users/${userId}/force-logout`,
    ACTIVITY: (userId: string) => `/api/admin_users/${userId}/activity`,
    BY_ID: (userId: string) => `/api/admin_users/${userId}`,
  },

  // Admin Roles
  ADMIN_ROLES: {
    BASE: '/api/admin_roles',
    BY_ID: (roleId: string) => `/api/admin_roles/${roleId}`,
    PERMISSIONS: (roleId: string) => `/api/admin_roles/${roleId}/permissions`,
  },

  // User Roles
  USER_ROLES: {
    BASE: '/api/user-roles',
    BY_ID: (roleId: string) => `/api/user-roles/${roleId}`,
  },

  // Client Users
  CLIENT_USERS: {
    BASE: '/api/client-users',
    BY_ID: (userId: string) => `/api/client-users/${userId}`,
    RESET_PASSWORD: (userId: string) => `/api/client-users/${userId}/reset-password`,
  },

  // Clients
  CLIENTS: {
    BASE: '/api/clients',
    BY_ID: (clientId: string) => `/api/clients/${clientId}`,
    SEND_WELCOME_EMAIL: (clientId: string) => `/api/clients/${clientId}/send-welcome-email`,
    INCREMENT_CALL: (clientId: string) => `/api/clients/${clientId}/increment-call`,
    RESET_MONTHLY_USAGE: '/api/clients/reset-monthly-usage',
    ELEVENLABS_USAGE: (clientId: string) => `/api/clients/${clientId}/elevenlabs-usage`,
    AGENTS_ANALYTICS: (clientId: string, days?: number) => `/api/clients/${clientId}/agents-analytics${days ? `?days=${days}` : ''}`,
  },

  // Plans
  PLANS: {
    BASE: '/api/plans',
    BY_ID: (planId: string) => `/api/plans/${planId}`,
  },

  // Assigned Plans
  ASSIGNED_PLANS: {
    BASE: '/api/assigned-plans',
    BY_ID: (assignmentId: string) => `/api/assigned-plans/${assignmentId}`,
    BY_CLIENT: (clientId: string) => `/api/clients/${clientId}/assigned-plans`,
    TOGGLE_ENABLED: (assignmentId: string) => `/api/assigned-plans/${assignmentId}/enable`,
  },

  // Knowledge Base
  KNOWLEDGE_BASE: {
    BASE: '/api/knowledge-base',
    BY_ID: (id: string) => `/api/knowledge-base/${id}`,
  },

  // Upload
  UPLOAD: {
    BASE: '/api/upload',
  },

  // Languages
  LANGUAGES: {
    BASE: '/api/languages',
    BY_ID: (id: string) => `/api/languages/${id}`,
  },

  // Voices
  VOICES: {
    BASE: '/api/voices',
  },

  // Agents
  AGENTS: {
    BASE: '/api/agents',
  },

  // Sales Persons / Referrals
  SALES_PERSONS: {
    BASE: '/api/sales-persons',
    ME: '/api/sales-persons/me',
    ME_REFERRALS: '/api/sales-persons/me/referrals',
  },

  // Workspace Secrets
  WORKSPACE_SECRETS: {
    LOCAL: '/api/workspace-secrets/local',
  },

  // MCP Servers
  MCP_SERVERS: {
    BASE: '/api/mcp-servers',
    BY_ID: (id: string) => `/api/mcp-servers/${id}`,
  },
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to build external API URLs
export const buildExternalApiUrl = (baseUrl: string, endpoint: string): string => {
  return `${baseUrl}${endpoint}`;
};

// Default fetch options
export const defaultFetchOptions = {
  credentials: 'include' as const,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Debug logging for API configuration
if (typeof window !== 'undefined') {
  console.log('🔧 API Configuration Debug:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
  console.log('- Window location:', window.location.href);
  console.log('- Final API_BASE_URL:', API_BASE_URL);
}

// API utility functions
export const apiUtils = {
  // GET request
  get: async (endpoint: string, options: RequestInit = {}) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      ...defaultFetchOptions,
      ...options,
      method: 'GET',
    });
    return response;
  },

  // POST request
  post: async (endpoint: string, data?: any, options: RequestInit = {}) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      ...defaultFetchOptions,
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response;
  },

  // PUT request
  put: async (endpoint: string, data?: any, options: RequestInit = {}) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      ...defaultFetchOptions,
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response;
  },

  // DELETE request
  delete: async (endpoint: string, options: RequestInit = {}) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      ...defaultFetchOptions,
      ...options,
      method: 'DELETE',
    });
    return response;
  },

  // File upload
  upload: async (endpoint: string, formData: FormData, options: RequestInit = {}) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      ...defaultFetchOptions,
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
    });
    return response;
  },

  // External API GET request
  externalGet: async (baseUrl: string, endpoint: string, options: RequestInit = {}) => {
    const url = buildExternalApiUrl(baseUrl, endpoint);
    const response = await fetch(url, {
      ...options,
      method: 'GET',
    });
    return response;
  },

  // External API GET request with custom headers
  externalGetWithHeaders: async (baseUrl: string, endpoint: string, headers: Record<string, string>, options: RequestInit = {}) => {
    const url = buildExternalApiUrl(baseUrl, endpoint);
    const response = await fetch(url, {
      ...options,
      method: 'GET',
      headers,
    });
    return response;
  },

  patch: async (endpoint: string, data?: any, options: RequestInit = {}) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      ...defaultFetchOptions,
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    return response;
  },
};

// Export commonly used API functions
export const api = {
  // Auth
  login: (data: any) => apiUtils.post(API_ENDPOINTS.AUTH.LOGIN, data),
  
  // Admin Users
  getCurrentUser: () => apiUtils.get(API_ENDPOINTS.ADMIN_USERS.ME),
  getAdminUsers: () => apiUtils.get(API_ENDPOINTS.ADMIN_USERS.BASE),
  getAdminUser: (userId: string) => apiUtils.get(API_ENDPOINTS.ADMIN_USERS.BY_ID(userId)),
  createAdminUser: (data: any) => apiUtils.post(API_ENDPOINTS.ADMIN_USERS.BASE, data),
  updateAdminUser: (userId: string, data: any) => apiUtils.put(API_ENDPOINTS.ADMIN_USERS.BY_ID(userId), data),
  deleteAdminUser: (userId: string) => apiUtils.delete(API_ENDPOINTS.ADMIN_USERS.BY_ID(userId)),
  resetAdminUserPassword: (userId: string, data: any) => apiUtils.post(API_ENDPOINTS.ADMIN_USERS.RESET_PASSWORD(userId), data),
  forceLogoutUser: (userId: string) => apiUtils.post(API_ENDPOINTS.ADMIN_USERS.FORCE_LOGOUT(userId)),
  getUserActivity: (userId: string) => apiUtils.get(API_ENDPOINTS.ADMIN_USERS.ACTIVITY(userId)),
  
  // Admin Roles
  getAdminRoles: () => apiUtils.get(API_ENDPOINTS.ADMIN_ROLES.BASE),
  getAdminRole: (roleId: string) => apiUtils.get(API_ENDPOINTS.ADMIN_ROLES.BY_ID(roleId)),
  createAdminRole: (data: any) => apiUtils.post(API_ENDPOINTS.ADMIN_ROLES.BASE, data),
  updateAdminRole: (roleId: string, data: any) => apiUtils.put(API_ENDPOINTS.ADMIN_ROLES.BY_ID(roleId), data),
  getAdminRolePermissions: (roleId: string) => apiUtils.get(API_ENDPOINTS.ADMIN_ROLES.PERMISSIONS(roleId)),
  setAdminRolePermissions: (roleId: string, permissions: string[]) => apiUtils.put(API_ENDPOINTS.ADMIN_ROLES.PERMISSIONS(roleId), { permissions }),
  deleteAdminRole: (roleId: string) => apiUtils.delete(API_ENDPOINTS.ADMIN_ROLES.BY_ID(roleId)),
  
  // User Roles
  getUserRoles: () => apiUtils.get(API_ENDPOINTS.USER_ROLES.BASE),
  getUserRole: (roleId: string) => apiUtils.get(API_ENDPOINTS.USER_ROLES.BY_ID(roleId)),
  createUserRole: (data: any) => apiUtils.post(API_ENDPOINTS.USER_ROLES.BASE, data),
  updateUserRole: (roleId: string, data: any) => apiUtils.put(API_ENDPOINTS.USER_ROLES.BY_ID(roleId), data),
  
  // Client Users
  getClientUsers: () => apiUtils.get(API_ENDPOINTS.CLIENT_USERS.BASE),
  getClientUser: (userId: string) => apiUtils.get(API_ENDPOINTS.CLIENT_USERS.BY_ID(userId)),
  createClientUser: (data: any) => apiUtils.post(API_ENDPOINTS.CLIENT_USERS.BASE, data),
  updateClientUser: (userId: string, data: any) => apiUtils.put(API_ENDPOINTS.CLIENT_USERS.BY_ID(userId), data),
  deleteClientUser: (userId: string) => apiUtils.delete(API_ENDPOINTS.CLIENT_USERS.BY_ID(userId)),
  resetClientUserPassword: (userId: string) => apiUtils.post(API_ENDPOINTS.CLIENT_USERS.RESET_PASSWORD(userId)),
  
  // Clients
  getClients: () => apiUtils.get(API_ENDPOINTS.CLIENTS.BASE),
  getClient: (clientId: string) => apiUtils.get(API_ENDPOINTS.CLIENTS.BY_ID(clientId)),
  createClient: (data: any) => apiUtils.post(API_ENDPOINTS.CLIENTS.BASE, data),
  updateClient: (clientId: string, data: any) => apiUtils.put(API_ENDPOINTS.CLIENTS.BY_ID(clientId), data),
      sendWelcomeEmail: (clientId: string) => apiUtils.post(API_ENDPOINTS.CLIENTS.SEND_WELCOME_EMAIL(clientId)),
    incrementCallCount: (clientId: string) => apiUtils.post(API_ENDPOINTS.CLIENTS.INCREMENT_CALL(clientId)),
    resetMonthlyUsage: () => apiUtils.post(API_ENDPOINTS.CLIENTS.RESET_MONTHLY_USAGE),
    getElevenLabsUsage: (clientId: string) => apiUtils.get(API_ENDPOINTS.CLIENTS.ELEVENLABS_USAGE(clientId)),
    getAgentsAnalytics: (clientId: string, days?: number) => apiUtils.get(API_ENDPOINTS.CLIENTS.AGENTS_ANALYTICS(clientId, days)),
  
  // Plans
  getPlans: () => apiUtils.get(API_ENDPOINTS.PLANS.BASE),
  getPlan: (planId: string) => apiUtils.get(API_ENDPOINTS.PLANS.BY_ID(planId)),
  createPlan: (data: any) => apiUtils.post(API_ENDPOINTS.PLANS.BASE, data),
  updatePlan: (planId: string, data: any) => apiUtils.put(API_ENDPOINTS.PLANS.BY_ID(planId), data),
  deletePlan: (planId: string) => apiUtils.delete(API_ENDPOINTS.PLANS.BY_ID(planId)),
  
  // Assigned Plans
  getAssignedPlans: () => apiUtils.get(API_ENDPOINTS.ASSIGNED_PLANS.BASE),
  getAssignedPlansForClient: (clientId: string) => apiUtils.get(API_ENDPOINTS.ASSIGNED_PLANS.BY_CLIENT(clientId)),
  assignPlan: (data: any) => apiUtils.post(API_ENDPOINTS.ASSIGNED_PLANS.BASE, data),
  deleteAssignedPlan: (assignmentId: string) => apiUtils.delete(API_ENDPOINTS.ASSIGNED_PLANS.BY_ID(assignmentId)),
  toggleAssignedPlanEnabled: (assignmentId: string, isEnabled: boolean) => apiUtils.patch(API_ENDPOINTS.ASSIGNED_PLANS.TOGGLE_ENABLED(assignmentId), { is_enabled: isEnabled ? 1 : 0 }),
  
  // Knowledge Base
  getKnowledgeBase: () => apiUtils.get(API_ENDPOINTS.KNOWLEDGE_BASE.BASE),
  createKnowledgeBaseItem: (data: any) => apiUtils.post(API_ENDPOINTS.KNOWLEDGE_BASE.BASE, data),
  deleteKnowledgeBaseItem: (id: string) => apiUtils.delete(API_ENDPOINTS.KNOWLEDGE_BASE.BY_ID(id)),
  
  // Upload
  uploadFile: (formData: FormData) => apiUtils.upload(API_ENDPOINTS.UPLOAD.BASE, formData),
  
  // Languages
  getLanguages: () => apiUtils.get(API_ENDPOINTS.LANGUAGES.BASE),
  createLanguage: (data: any) => apiUtils.post(API_ENDPOINTS.LANGUAGES.BASE, data),
  updateLanguage: (id: string, data: any) => apiUtils.patch(API_ENDPOINTS.LANGUAGES.BY_ID(id), data),
  deleteLanguage: (id: string) => apiUtils.delete(API_ENDPOINTS.LANGUAGES.BY_ID(id)),
  
  // Voices
  getVoices: () => apiUtils.get(API_ENDPOINTS.VOICES.BASE),

  // Agents
  getAgents: () => apiUtils.get(API_ENDPOINTS.AGENTS.BASE),

  // Workspace Secrets
  getWorkspaceSecretsLocal: () => apiUtils.get(API_ENDPOINTS.WORKSPACE_SECRETS.LOCAL),

  // MCP Servers
  getMcpServers: () => apiUtils.get(API_ENDPOINTS.MCP_SERVERS.BASE),
  getMcpServer: (id: string) => apiUtils.get(API_ENDPOINTS.MCP_SERVERS.BY_ID(id)),
  createMcpServer: (data: any) => apiUtils.post(API_ENDPOINTS.MCP_SERVERS.BASE, data),
  
  // External APIs
  elevenLabs: {
    getModels: (apiKey?: string) => apiKey 
      ? apiUtils.externalGetWithHeaders(EXTERNAL_APIS.ELEVENLABS.BASE_URL, EXTERNAL_APIS.ELEVENLABS.ENDPOINTS.MODELS, { 'xi-api-key': apiKey })
      : apiUtils.externalGet(EXTERNAL_APIS.ELEVENLABS.BASE_URL, EXTERNAL_APIS.ELEVENLABS.ENDPOINTS.MODELS),
    getUserSubscription: (apiKey?: string) => apiKey 
      ? apiUtils.externalGetWithHeaders(EXTERNAL_APIS.ELEVENLABS.BASE_URL, EXTERNAL_APIS.ELEVENLABS.ENDPOINTS.USER_SUBSCRIPTION, { 'xi-api-key': apiKey })
      : apiUtils.externalGet(EXTERNAL_APIS.ELEVENLABS.BASE_URL, EXTERNAL_APIS.ELEVENLABS.ENDPOINTS.USER_SUBSCRIPTION),
    getUser: (apiKey?: string) => apiKey 
      ? apiUtils.externalGetWithHeaders(EXTERNAL_APIS.ELEVENLABS.BASE_URL, EXTERNAL_APIS.ELEVENLABS.ENDPOINTS.USER, { 'xi-api-key': apiKey })
      : apiUtils.externalGet(EXTERNAL_APIS.ELEVENLABS.BASE_URL, EXTERNAL_APIS.ELEVENLABS.ENDPOINTS.USER),
    getVoices: (apiKey?: string) => apiKey 
      ? apiUtils.externalGetWithHeaders(EXTERNAL_APIS.ELEVENLABS.BASE_URL, EXTERNAL_APIS.ELEVENLABS.ENDPOINTS.VOICES, { 'xi-api-key': apiKey })
      : apiUtils.externalGet(EXTERNAL_APIS.ELEVENLABS.BASE_URL, EXTERNAL_APIS.ELEVENLABS.ENDPOINTS.VOICES),
  },
}; 