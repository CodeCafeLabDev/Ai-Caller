/**
 * Centralized URL Configuration for Frontend
 * All base URLs and API endpoints are maintained here
 */

const rawBackendBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const normalizedBackendBase = rawBackendBase.replace(/\/$/, '');
const normalizedBackendApi = normalizedBackendBase.endsWith('/api') ? normalizedBackendBase : `${normalizedBackendBase}/api`;

export const config = {
  // ElevenLabs API Configuration
  elevenlabs: {
    base: 'https://api.elevenlabs.io/v1',
    convai: {
      agents: 'https://api.elevenlabs.io/v1/convai/agents',
      conversations: 'https://api.elevenlabs.io/v1/convai/conversations',
      secrets: 'https://api.elevenlabs.io/v1/convai/secrets',
      knowledgeBase: 'https://api.elevenlabs.io/v1/convai/knowledge-base',
      tools: 'https://api.elevenlabs.io/v1/convai/tools',
      webhooks: 'https://api.elevenlabs.io/v1/workspace/webhooks'
    },
    legacy: {
      agents: 'https://api.elevenlabs.io/v1/agents',
      secrets: 'https://api.elevenlabs.io/v1/secrets',
      workspaceSecrets: 'https://api.elevenlabs.io/v1/workspace/secrets',
      voices: 'https://api.elevenlabs.io/v1/voices',
      knowledgeBase: 'https://api.elevenlabs.io/v1/knowledge-base'
    }
  },

  // Backend Configuration
  backend: {
    base: normalizedBackendBase,
    api: normalizedBackendApi
  },

  // Frontend Configuration
  frontend: {
    base: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
  },

  // Environment Configuration
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test'
  }
};

// Helper functions for building URLs
export const urls = {
  // ElevenLabs URL builders
  elevenlabs: {
    agent: (agentId: string) => `${config.elevenlabs.convai.agents}/${agentId}`,
    agentConversations: (agentId: string) => `${config.elevenlabs.convai.agents}/${agentId}/conversations`,
    agentDuplicate: (agentId: string) => `${config.elevenlabs.convai.agents}/${agentId}/duplicate`,
    agentLink: (agentId: string) => `${config.elevenlabs.convai.agents}/${agentId}/link`,
    agentSettings: (agentId: string) => `${config.elevenlabs.legacy.agents}/${agentId}/settings`,
    agentWidgetConfig: (agentId: string) => `${config.elevenlabs.legacy.agents}/${agentId}/widget-config`,
    knowledgeBase: {
      url: `${config.elevenlabs.convai.knowledgeBase}/url`,
      text: `${config.elevenlabs.convai.knowledgeBase}/text`,
      file: `${config.elevenlabs.convai.knowledgeBase}/file`,
      document: (docId: string) => `${config.elevenlabs.convai.knowledgeBase}/${docId}`,
      content: (docId: string) => `${config.elevenlabs.convai.knowledgeBase}/${docId}/content`,
      dependentAgents: (docId: string) => `${config.elevenlabs.convai.knowledgeBase}/${docId}/dependent-agents`
    },
    secrets: {
      create: config.elevenlabs.convai.secrets,
      update: (secretId: string) => `${config.elevenlabs.convai.secrets}/${encodeURIComponent(secretId)}`,
      delete: (secretId: string) => `${config.elevenlabs.convai.secrets}/${encodeURIComponent(secretId)}`
    }
  },

  // Backend URL builders
  backend: {
    api: (endpoint: string) => `${config.backend.api}${endpoint}`,
    health: () => `${config.backend.base}/api/health`,
    voices: () => `${config.backend.base}/api/voices`,
    campaigns: {
      submit: () => `${config.backend.api}/campaigns`,
      list: () => `${config.backend.api}/campaigns`,
      listForClient: (clientId: string) => `${config.backend.api}/campaigns/client/${encodeURIComponent(clientId)}`,
      details: (id: string) => `${config.backend.api}/campaigns/${encodeURIComponent(id)}`,
          localDetails: (id: string) => `${config.backend.api}/campaigns/${encodeURIComponent(id)}/local`,
    recipients: (id: string) => `${config.backend.api}/campaigns/${encodeURIComponent(id)}/recipients`,
    testBatch: (id: string) => `${config.backend.api}/campaigns/test-batch/${encodeURIComponent(id)}`,
    cancel: (id: string) => `${config.backend.api}/campaigns/${encodeURIComponent(id)}/cancel`,
    retry: (id: string) => `${config.backend.api}/campaigns/${encodeURIComponent(id)}/retry`,
    liveCalls: () => `${config.backend.api}/campaigns/live-calls`,
    flagMisuse: () => `${config.backend.api}/campaigns/flag-misuse`,
    flaggedCalls: () => `${config.backend.api}/campaigns/flagged-calls`,
      pause: (id: string) => `${config.backend.api}/campaigns/${encodeURIComponent(id)}/pause`,
      resume: (id: string) => `${config.backend.api}/campaigns/${encodeURIComponent(id)}/resume`,
      patch: (id: string) => `${config.backend.api}/campaigns/${encodeURIComponent(id)}`,
      delete: (id: string) => `${config.backend.api}/campaigns/${encodeURIComponent(id)}`,
      phoneNumbers: () => `${config.backend.api}/campaigns/phone-numbers`,
      agents: (clientId?: string) => clientId ? `${config.backend.api}/campaigns/agents?client_id=${encodeURIComponent(clientId)}` : `${config.backend.api}/campaigns/agents`
    }
  }
};

// Default export for backward compatibility
export default { config, urls };
