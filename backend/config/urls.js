/**
 * Centralized URL Configuration
 * All base URLs and API endpoints are maintained here
 */

const config = {
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

  // Local Backend Configuration
  backend: {
    base: process.env.BACKEND_URL || 'http://localhost:5000',
    api: process.env.BACKEND_URL || 'http://localhost:5000/api'
  },

  // Frontend Configuration
  frontend: {
    base: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || 'ai_caller',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  },

  // Environment Configuration
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test'
  }
};

// Helper functions for building URLs
const urlHelpers = {
  // ElevenLabs URL builders
  elevenlabs: {
    agent: (agentId) => `${config.elevenlabs.convai.agents}/${agentId}`,
    agentConversations: (agentId) => `${config.elevenlabs.convai.agents}/${agentId}/conversations`,
    agentDuplicate: (agentId) => `${config.elevenlabs.convai.agents}/${agentId}/duplicate`,
    agentLink: (agentId) => `${config.elevenlabs.convai.agents}/${agentId}/link`,
    agentSettings: (agentId) => `${config.elevenlabs.legacy.agents}/${agentId}/settings`,
    agentWidgetConfig: (agentId) => `${config.elevenlabs.legacy.agents}/${agentId}/widget-config`,
    knowledgeBase: {
      url: `${config.elevenlabs.convai.knowledgeBase}/url`,
      text: `${config.elevenlabs.convai.knowledgeBase}/text`,
      file: `${config.elevenlabs.convai.knowledgeBase}/file`,
      document: (docId) => `${config.elevenlabs.convai.knowledgeBase}/${docId}`,
      content: (docId) => `${config.elevenlabs.convai.knowledgeBase}/${docId}/content`,
      dependentAgents: (docId) => `${config.elevenlabs.convai.knowledgeBase}/${docId}/dependent-agents`
    },
    secrets: {
      create: config.elevenlabs.convai.secrets,
      update: (secretId) => `${config.elevenlabs.convai.secrets}/${encodeURIComponent(secretId)}`,
      delete: (secretId) => `${config.elevenlabs.convai.secrets}/${encodeURIComponent(secretId)}`
    }
  },

  // Backend URL builders
  backend: {
    api: (endpoint) => `${config.backend.api}${endpoint}`,
    health: () => `${config.backend.base}/api/health`,
    voices: () => `${config.backend.base}/api/voices`
  }
};

module.exports = {
  config,
  urls: urlHelpers
};
