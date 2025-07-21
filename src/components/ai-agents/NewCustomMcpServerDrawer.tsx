import React, { useState } from "react";

const SERVER_TYPES = [
  { value: "sse", label: "SSE" },
  { value: "streamable", label: "Streamable HTTP" },
];
const URL_TYPES = [
  { value: "Value", label: "Value" },
  { value: "Secret", label: "Secret" },
  { value: "Dynamic Variable", label: "Dynamic Variable" },
];
const SECRET_OPTIONS = [
  { value: "none", label: "None" },
  // Add more options as needed
];
const HEADER_TYPES = [
  { value: "Text", label: "Value" },
  { value: "Secret", label: "Secret" },
  { value: "Dynamic Variable", label: "Dynamic Variable" },
];
const TOOL_APPROVAL_MODES = [
  { value: "always", label: "Always Ask", description: "Maximum security. The agent will request your permission before each tool use.", recommended: true },
  { value: "fine", label: "Fine-Grained Tool Approval", description: "Disable & pre-select tools which can run automatically & those requiring approval." },
  { value: "none", label: "No Approval", description: "The assistant can use any tool without approval." },
];
const TOOLS = [
  { value: "tool1", label: "Tool 1" },
  { value: "tool2", label: "Tool 2" },
  // Add more tools as needed
];

export default function NewCustomMcpServerDrawer({ open = true, onClose }: { open?: boolean; onClose: () => void }) {
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [serverType, setServerType] = useState("sse");
  const [urlType, setUrlType] = useState("Value");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("none");
  const [headers, setHeaders] = useState<any[]>([]);
  const [approvalMode, setApprovalMode] = useState("always");
  const [trusted, setTrusted] = useState(false);
  // Fine-grained tool approval state
  const [toolApprovals, setToolApprovals] = useState<{ [key: string]: boolean }>({});

  // Drawer animation
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-lg z-50 transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: 480 }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-bold">New Custom MCP Server</h2>
            <button onClick={onClose} className="text-2xl text-gray-400">&times;</button>
          </div>
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Basic Information */}
            <div>
              <div className="font-semibold mb-1">Basic Information</div>
              <label className="block text-sm mb-1">Name</label>
              <input className="border rounded w-full px-3 py-2 mb-2" value={name} onChange={e => setName(e.target.value)} />
              <label className="block text-sm mb-1">Description</label>
              <textarea className="border rounded w-full px-3 py-2" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            {/* Server Configuration */}
            <div>
              <div className="font-semibold mb-1">Server Configuration</div>
              <div className="flex gap-2 mb-2">
                {SERVER_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    className={`px-4 py-2 rounded ${serverType === t.value ? "bg-black text-white" : "bg-gray-200"}`}
                    onClick={() => setServerType(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-2">
                <select className="border rounded px-2 py-2" value={urlType} onChange={e => setUrlType(e.target.value)}>
                  {URL_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input className="border rounded flex-1 px-3 py-2" placeholder="https://example.com/sse" value={url} onChange={e => setUrl(e.target.value)} />
              </div>
            </div>
            {/* Secret Token */}
            <div>
              <div className="font-semibold mb-1">Secret Token</div>
              <select className="border rounded px-2 py-2 w-full" value={secret} onChange={e => setSecret(e.target.value)}>
                {SECRET_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* HTTP Headers */}
            <div>
              <div className="font-semibold mb-1">HTTP Headers</div>
              {headers.map((header, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <select
                    className="border rounded px-2 py-2"
                    value={header.type}
                    onChange={e => {
                      const newHeaders = [...headers];
                      newHeaders[idx].type = e.target.value;
                      setHeaders(newHeaders);
                    }}
                  >
                    {HEADER_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    className="border rounded px-2 py-2 flex-1"
                    placeholder="Name"
                    value={header.name}
                    onChange={e => {
                      const newHeaders = [...headers];
                      newHeaders[idx].name = e.target.value;
                      setHeaders(newHeaders);
                    }}
                  />
                  <input
                    className="border rounded px-2 py-2 flex-1"
                    placeholder={header.type === 'Text' ? 'Value' : header.type === 'Secret' ? 'Secret' : 'Variable'}
                    value={header.value}
                    onChange={e => {
                      const newHeaders = [...headers];
                      newHeaders[idx].value = e.target.value;
                      setHeaders(newHeaders);
                    }}
                  />
                  <button
                    className="text-red-500 px-2"
                    onClick={() => setHeaders(headers.filter((_, i) => i !== idx))}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                className="bg-gray-200 px-3 py-2 rounded"
                type="button"
                onClick={() => setHeaders([...headers, { type: "Text", name: "", value: "" }])}
              >
                Add header
              </button>
            </div>
            {/* Tool Approval Mode */}
            <div>
              <div className="font-semibold mb-1">Tool Approval Mode</div>
              <div className="space-y-2">
                {TOOL_APPROVAL_MODES.map(mode => (
                  <label key={mode.value} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tool-approval-mode"
                      value={mode.value}
                      checked={approvalMode === mode.value}
                      onChange={() => setApprovalMode(mode.value)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium">{mode.label}</span>
                      {mode.recommended && <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">Recommended</span>}
                      <div className="text-xs text-gray-500">{mode.description}</div>
                    </span>
                  </label>
                ))}
              </div>
              {approvalMode === "fine" && (
                <div className="mt-3 border rounded p-3">
                  <div className="font-medium mb-2 text-sm">Fine-Grained Tool Approval</div>
                  {TOOLS.map(tool => (
                    <div key={tool.value} className="flex items-center gap-2 mb-1">
                      <input
                        type="checkbox"
                        checked={!!toolApprovals[tool.value]}
                        onChange={e => setToolApprovals({ ...toolApprovals, [tool.value]: e.target.checked })}
                      />
                      <span>{tool.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Confirmation */}
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={trusted} onChange={e => setTrusted(e.target.checked)} />
                I trust this server
              </label>
              <div className="text-xs text-gray-500 mt-1">
                Custom MCP servers are not verified by ElevenLabs
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex justify-end gap-2 p-4 border-t">
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
            <button
              onClick={() => {/* Placeholder for save logic */ onClose(); }}
              className="px-4 py-2 rounded bg-black text-white"
              disabled={!name || !url || !trusted}
            >
              Add Server
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 