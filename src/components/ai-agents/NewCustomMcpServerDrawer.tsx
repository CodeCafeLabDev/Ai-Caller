import React, { useEffect, useState } from "react";

const SERVER_TYPES = [
  { value: "sse", label: "SSE" },
  { value: "streamable", label: "Streamable HTTP" },
];

const URL_TYPES = [
  { value: "Value", label: "Value" },
  { value: "Secret", label: "Secret" },
  { value: "Dynamic Variable", label: "Dynamic Variable" },
];

const TOOL_APPROVAL_MODES = [
  { 
    value: "always", 
    label: "Always Ask", 
    description: "Maximum security. The agent will request your permission before each tool use.", 
    recommended: true,
    icon: "🛡️"
  },
  { 
    value: "fine", 
    label: "Fine-Grained Tool Approval", 
    description: "Disable & pre-select tools which can run automatically & those requiring approval.",
    icon: "⚙️"
  },
  { 
    value: "none", 
    label: "No Approval", 
    description: "The assistant can use any tool without approval.",
    icon: "👁️"
  },
];

export default function NewCustomMcpServerDrawer({ open = true, onClose, onCreated }: { open?: boolean; onClose: () => void; onCreated?: (created: any) => void }) {
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [serverType, setServerType] = useState("streamable");
  const [urlType, setUrlType] = useState("Value");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("none");
  const [headers, setHeaders] = useState<any[]>([]);
  const [approvalMode, setApprovalMode] = useState("always");
  const [trusted, setTrusted] = useState(false);
  const [secretOptions, setSecretOptions] = useState<{ value: string; label: string }[]>([
    { value: "none", label: "None" }
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic URL placeholder only (no pre-fill)
  const urlPlaceholder = serverType === "sse" ? "https://example.com/sse" : "https://example.com/mcp";

  useEffect(() => {
    async function loadSecrets() {
      try {
        console.log('[DEBUG] Loading workspace secrets...');
        const res = await fetch("/api/workspace-secrets/local", { credentials: "include" });
        console.log('[DEBUG] Workspace secrets response status:', res.status);
        if (!res.ok) {
          console.error('[DEBUG] Workspace secrets response not ok:', res.status);
          return;
        }
        const json = await res.json();
        console.log('[DEBUG] Workspace secrets response:', json);
        const rows = json?.secrets || [];
        console.log('[DEBUG] Workspace secrets rows:', rows);
        const opts = [{ value: "none", label: "None" }, ...rows.map((r: any) => ({ value: r.secret_id, label: r.name }))];
        console.log('[DEBUG] Final secret options:', opts);
        setSecretOptions(opts);
      } catch (error) {
        console.error('[DEBUG] Error loading workspace secrets:', error);
      }
    }
    if (open) {
      loadSecrets();
    }
  }, [open]);

  async function handleAddServer() {
    setSaving(true);
    setError(null);
    
    // Form validation
    if (!name.trim()) {
      setError("Server name is required");
      setSaving(false);
      return;
    }
    
    if (!url.trim()) {
      setError("Server URL is required");
      setSaving(false);
      return;
    }
    
    if (!trusted) {
      setError("You must trust this server to continue");
      setSaving(false);
      return;
    }
    
    try {
      console.log('[DEBUG] Creating MCP server with payload:', { name, description, serverType, url, secret, headers, approvalMode, trusted });
      
      const payload: any = {
        name: name.trim(),
        description: description.trim(),
        type: serverType,
        url: url.trim(),
        trusted,
        approval_mode: approvalMode,
      };
      
      if (secret && secret !== "none") {
        payload.secret = { type: "workspace_secret", secret_id: secret };
      }
      
      if (headers && headers.length > 0) {
        payload.headers = headers
          .filter(h => h?.name && h?.value)
          .map(h => ({ 
            name: h.name.trim(), 
            type: h.type === "Secret" ? "workspace_secret" : "text", 
            value: h.value.trim() 
          }));
      }
      
      console.log('[DEBUG] Final payload:', payload);
      
      const res = await fetch("/api/mcp-servers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      console.log('[DEBUG] MCP server creation response status:', res.status);
      
      const json = await res.json();
      console.log('[DEBUG] MCP server creation response:', json);
      
      if (!res.ok || !json?.success) {
        const errorMessage = json?.error || 'Failed to create MCP server';
        console.error('[DEBUG] MCP server creation failed:', errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log('[DEBUG] MCP server created successfully:', json.data);
      onCreated?.(json.data);
      onClose();
    } catch (e: any) {
      console.error('[DEBUG] Error creating MCP server:', e);
      setError(e?.message || "Failed to create MCP server");
    } finally {
      setSaving(false);
    }
  }

  const addHeader = () => {
    setHeaders([...headers, { type: "Text", name: "", value: "" }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: string, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />
      
      {/* Right-side Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-xl z-50 transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 text-lg">🔗</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">New Custom MCP Server</h2>
                <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">Alpha</span>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Basic Information</h3>
              <p className="text-sm text-gray-600 mb-4">Identify your MCP server with a clear name and description.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter server name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter server description"
                  />
                </div>
              </div>
            </div>

            {/* Server Configuration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Server Configuration</h3>
              <p className="text-sm text-gray-600 mb-4">Specify how to connect to your MCP server.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Server type</label>
                  <div className="flex gap-2">
                    {SERVER_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setServerType(type.value)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          serverType === type.value
                            ? "bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Server URL</label>
                  <div className="flex gap-3">
                    <select
                      value={urlType}
                      onChange={(e) => setUrlType(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {URL_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={urlPlaceholder}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Secret Token */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Secret Token</h3>
              <p className="text-sm text-gray-600 mb-4">Configure a secret token for secure server access.</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secret</label>
                <select
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {secretOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* HTTP Headers */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">HTTP Headers</h3>
                  <p className="text-sm text-gray-600">Add custom headers for additional configuration or authentication.</p>
                </div>
                <button
                  type="button"
                  onClick={addHeader}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Add header
                </button>
              </div>
              
              {headers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No headers added yet
                </div>
              ) : (
                <div className="space-y-3">
                  {headers.map((header, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={header.name}
                            onChange={(e) => updateHeader(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter header name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                          <input
                            type="text"
                            value={header.value}
                            onChange={(e) => updateHeader(index, 'value', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter header value"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeHeader(index)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tool Approval Mode */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Tool Approval Mode</h3>
              <p className="text-sm text-gray-600 mb-4">Control how the agent requests permission to use tools from this MCP server.</p>
              
              <div className="space-y-3">
                {TOOL_APPROVAL_MODES.map(mode => (
                  <label key={mode.value} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="tool-approval-mode"
                      value={mode.value}
                      checked={approvalMode === mode.value}
                      onChange={() => setApprovalMode(mode.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{mode.icon}</span>
                        <span className="font-medium text-gray-900">{mode.label}</span>
                        {mode.recommended && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{mode.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Confirmation */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Confirmation</h3>
              <p className="text-sm text-gray-600 mb-3">Custom MCP servers are not verified by ElevenLabs</p>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trusted}
                  onChange={(e) => setTrusted(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">I trust this server</span>
              </label>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {saving && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="text-blue-800 text-sm">Creating MCP server...</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddServer}
              disabled={!name || !url || !trusted || saving}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Adding..." : "Add Server"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 