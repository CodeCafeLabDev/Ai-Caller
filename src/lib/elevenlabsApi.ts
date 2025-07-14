const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

function withApiKeyHeaders(headers: Record<string, string> = {}) {
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
  getAgent: (id: string): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents/${id}`, {
    headers: withApiKeyHeaders(),
  }),
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
  addToAgentKnowledgeBase: (id: string, data: any): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents/${id}/knowledge-base`, {
    method: "POST",
    headers: withApiKeyHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  }),
  getAgentsPage: (params: any): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents?${new URLSearchParams(params)}`, {
    headers: withApiKeyHeaders(),
  }),
  getConversations: (agentId: string): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents/${agentId}/conversations`, {
    headers: withApiKeyHeaders(),
  }),
  getConversationDetails: (agentId: string, conversationId: string): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents/${agentId}/conversations/${conversationId}`, {
    headers: withApiKeyHeaders(),
  }),
  getConversationAudio: (agentId: string, conversationId: string): Promise<Response> => fetch(`${ELEVENLABS_BASE_URL}/agents/${agentId}/conversations/${conversationId}/audio`, {
    headers: withApiKeyHeaders(),
  }),
};

export default elevenLabsApi; 