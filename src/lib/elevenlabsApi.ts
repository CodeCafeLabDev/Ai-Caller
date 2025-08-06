const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

function withApiKeyHeaders(headers: Record<string, string> = {}) {
  if (!ELEVENLABS_API_KEY) {
    console.warn("ElevenLabs API key not found. Please set NEXT_PUBLIC_ELEVENLABS_API_KEY environment variable.");
  }
  return ELEVENLABS_API_KEY
    ? { ...headers, "xi-api-key": ELEVENLABS_API_KEY }
    : headers;
}

export const elevenLabsApi = {
  getSignedUrl: (): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/signed-url`, {
    headers: withApiKeyHeaders(),
  }),
  createAgent: (data: any): Promise<Response> => {
    console.log("API KEY:", process.env.ELEVENLABS_API_KEY);
    return fetch(`${ELEVENLABS_BASE_URL}/convai/agents/create`, {
      method: "POST",
      headers: withApiKeyHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ conversation_config: {} }),
    });
  },
  getAgent: (id: string): Promise<Response> => {
    console.log(`[ElevenLabs API] Fetching agent details for agent ID: ${id}`, {
      agentId: id,
      timestamp: new Date().toISOString()
    });
    return fetch(`${ELEVENLABS_BASE_URL}/agents/${id}`, {
      headers: withApiKeyHeaders(),
    });
  },
  deleteAgent: (id: string): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents/${id}`, {
    method: "DELETE",
    headers: withApiKeyHeaders(),
  }),
  patchAgentSettings: (id: string, data: any): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents/${id}/settings`, {
    method: "PATCH",
    headers: withApiKeyHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  }),
  getAgentWidgetConfig: (id: string): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents/${id}/widget-config`, {
    headers: withApiKeyHeaders(),
  }),
  getShareableAgentLink: (id: string): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents/${id}/shareable-link`, {
    headers: withApiKeyHeaders(),
  }),
  postAgentAvatar: (id: string, formData: FormData): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents/${id}/avatar`, {
    method: "POST",
    body: formData,
    headers: withApiKeyHeaders(),
  }),
  getDocumentationFromAgent: (id: string): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents/${id}/documentation`, {
    headers: withApiKeyHeaders(),
  }),
  addSecretToAgentWidget: (id: string, data: any): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents/${id}/widget-secret`, {
    method: "POST",
    headers: withApiKeyHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  }),
  addToAgentKnowledgeBase: (id: string, data: any): Promise<Response> => {
    console.log(`[ElevenLabs API] Adding knowledge base item to agent ID: ${id}`, {
      agentId: id,
      knowledgeBaseData: data,
      timestamp: new Date().toISOString()
    });
    return fetch(`${ELEVENLABS_BASE_URL}/agents/${id}/knowledge-base`, {
      method: "POST",
      headers: withApiKeyHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    });
  },
  getAgentsPage: (params: any): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents?${new URLSearchParams(params)}`, {
    headers: withApiKeyHeaders(),
  }),
  getConversations: (agentId: string): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents/${agentId}/conversations`, {
    headers: withApiKeyHeaders(),
  }),
  deleteConversation: (conversationId: string): Promise<Response> =>
    fetch(`${ELEVENLABS_BASE_URL}/convai/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: withApiKeyHeaders(),
    }),
  getConversationDetails: (conversationId: string): Promise<Response> =>
    fetch(`${ELEVENLABS_BASE_URL}/convai/conversations/${conversationId}`, {
      headers: withApiKeyHeaders(),
    }),
  getConversationAudio: (conversationId: string): Promise<Response> =>
    fetch(`${ELEVENLABS_BASE_URL}/convai/conversations/${conversationId}/audio`, {
      headers: withApiKeyHeaders(),
    }),
  /**
   * Get character usage metrics (https://elevenlabs.io/docs/api-reference/usage/get)
   * @param params { start_unix: number, end_unix: number, breakdown_type?: string, include_workspace_metrics?: boolean, aggregation_interval?: string, metric?: string }
   */
  getUsageStats: (params: {
    start_unix: number,
    end_unix: number,
    breakdown_type?: string,
    include_workspace_metrics?: boolean,
    aggregation_interval?: string,
    metric?: string,
  }): Promise<Response> => {
    const url = new URL(`${ELEVENLABS_BASE_URL}/usage/character-stats`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.append(key, String(value));
    });
    return fetch(url.toString(), {
      headers: withApiKeyHeaders(),
    });
  },

  /**
   * List conversations (https://elevenlabs.io/docs/api-reference/conversations/list)
   * @param params { agent_id?: string, user_id?: string, call_successful?: string, call_start_before_unix?: number, call_start_after_unix?: number, page_size?: number, cursor?: string, summary_mode?: string }
   */
  listConversations: (params: {
    agent_id?: string,
    user_id?: string,
    call_successful?: string,
    call_start_before_unix?: number,
    call_start_after_unix?: number,
    page_size?: number,
    cursor?: string,
    summary_mode?: string,
  } = {}): Promise<Response> => {
    const url = new URL(`${ELEVENLABS_BASE_URL}/convai/conversations`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.append(key, String(value));
    });
    return fetch(url.toString(), {
      headers: withApiKeyHeaders(),
    });
  },
};

export default elevenLabsApi; 