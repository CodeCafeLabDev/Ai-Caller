"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
];
const LLM_MODELS = [
  { value: "gemini-flash", label: "Gemini 2.0 Flash (001)" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5", label: "GPT-3.5" },
];
const TOOL_OPTIONS = [
  { value: "end_call", label: "End call" },
  { value: "detect_language", label: "Detect language" },
  { value: "skip_turn", label: "Skip turn" },
  { value: "transfer_to_agent", label: "Transfer to agent" },
  { value: "transfer_to_number", label: "Transfer to number" },
  { value: "play_keypad_tone", label: "Play keypad touch tone" },
];
const COLOR_FIELDS = [
  "base", "base_hover", "base_active", "base_border", "base_subtle", "base_primary", "base_error",
  "accent", "accent_hover", "accent_active", "accent_border", "accent_subtle", "accent_primary"
];
const RADIUS_FIELDS = [
  { key: "overlay_padding", label: "overlay_padding" },
  { key: "button_radius", label: "button_radius" },
  { key: "input_radius", label: "input_radius" },
  { key: "bubble_radius", label: "bubble_radius" },
  { key: "sheet_radius", label: "sheet_radius" },
  { key: "compact_sheet_radius", label: "compact_sheet_radius" },
  { key: "dropdown_sheet_radius", label: "dropdown_sheet_radius" },
];
const TEXT_CONTENTS = [
  "main_label", "start_call", "start_chat", "new_call", "end_call", "mute_microphone", "change_language", "collapse", "expand", "copied", "accept_terms", "dismiss_terms", "listening_status", "speaking_status", "connecting_status", "chatting_status", "input_label", "input_placeholder", "input_placeholder_text_only", "input_placeholder_new_conversation", "user_ended_conversation", "agent_ended_conversation", "conversation_id", "error_occurred", "copy_id"
];

export default function AgentDetailsPage() {
  const params = useParams();
  const agentId = params.agent_id;
  const [localAgent, setLocalAgent] = useState<any>({});
  const [elevenLabsAgent, setElevenLabsAgent] = useState<any>({});
  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // 1. Add state for all fields in every tab (Voice, Widget, Advanced, Security, Analysis)
  const [agentSettings, setAgentSettings] = useState({
    language: "en",
    additional_languages: [] as string[],
    first_message: "",
  });
  const [widgetConfig, setWidgetConfig] = useState({
    voice: "Eric",
    multi_voice: false,
    use_flash: false,
    tts_output_format: "PCM 16000 Hz",
    pronunciation_dictionaries: [] as string[],
    latency: 0.5,
    stability: 0.5,
    speed: 0.5,
    similarity: 0.5,
  });
  const [voiceConfig, setVoiceConfig] = useState({
    voice: "Eric",
    multi_voice: false,
    use_flash: false,
    tts_output_format: "PCM 16000 Hz",
    pronunciation_dictionaries: [] as string[],
    latency: 0.5,
    stability: 0.5,
    speed: 0.5,
    similarity: 0.5,
  });
  const [securityConfig, setSecurityConfig] = useState({
    enable_authentication: false,
    allowlist: [] as string[],
    enable_overrides: false,
    fetch_initiation_client_data: false,
    post_call_webhook: "",
    enable_bursting: false,
    concurrent_calls_limit: -1,
    daily_calls_limit: 100000,
  });
  const [advancedConfig, setAdvancedConfig] = useState({
    turn_timeout: 7,
    silence_end_call_timeout: 20,
    max_conversation_duration: 300,
    keywords: "",
    text_only: false,
    user_input_audio_format: "PCM 16000 Hz",
    client_events: ["audio", "interruption", "user_transcript", "agent_response", "agent_response_correction"],
    privacy_settings: {
      store_call_audio: false,
      zero_ppi_retention_mode: false,
    },
    conversations_retention_period: 730,
    delete_transcript_and_derived_fields: false,
    delete_audio: false,
  });
  const [analysisConfig, setAnalysisConfig] = useState({
    evaluation_criteria: [] as string[],
    data_collection: [] as string[],
  });

  // 1. For each tab, track a 'dirty' state (unsaved changes) and show a Save button only if dirty
  // 2. On any field change in a tab, set the dirty state for that tab to true
  // 3. On Save, PATCH only the changed data to the correct endpoint, show status, and reset dirty state
  // 4. Ensure two-way data binding for all fields
  const [isDirty, setIsDirty] = useState({
    Agent: false,
    Voice: false,
    Widget: false,
    Advanced: false,
    Security: false,
    Analysis: false,
  });

  const [activeTab, setActiveTab] = useState("Agent");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/agents/${agentId}/details`)
      .then(res => res.json())
      .then(data => {
        setLocalAgent(data.local || {});
        setElevenLabsAgent(data.elevenlabs || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // Fetch languages from DB
    fetch('/api/languages')
      .then(res => res.json())
      .then(data => setLanguages(data.data || []));
  }, [agentId]);

  // Add variable handlers
  const addVar = (input: string, setInput: any, vars: string[], setVars: any) => {
    if (input.trim() && !vars.includes(input.trim())) {
      setVars([...vars, input.trim()]);
      setInput("");
    }
  };
  const removeVar = (v: string, vars: string[], setVars: any) => setVars(vars.filter((x: string) => x !== v));

  // Presets for temperature
  const tempPresets = [
    { label: "Deterministic", value: 0 },
    { label: "Creative", value: 0.5 },
    { label: "More Creative", value: 1 },
  ];

  // Helper for rendering color fields
  const renderColorFields = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {COLOR_FIELDS.map(f => (
        <div key={f} className="flex items-center gap-2">
          <label className="w-32 text-xs text-gray-600">{f}</label>
          <input type="color" className="w-8 h-8 border rounded" />
          <input type="text" className="border rounded px-2 py-1 w-28" placeholder="#ffffff" />
        </div>
      ))}
    </div>
  );

  // Helper for rendering radius fields
  const renderRadiusFields = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {RADIUS_FIELDS.map(f => (
        <div key={f.key} className="flex items-center gap-2">
          <label className="w-32 text-xs text-gray-600">{f.label}</label>
          <input type="number" className="border rounded px-2 py-1 w-20" />
        </div>
      ))}
    </div>
  );

  // Helper for rendering text content fields
  const renderTextContents = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {TEXT_CONTENTS.map(f => (
        <div key={f} className="flex items-center gap-2">
          <label className="w-48 text-xs text-gray-600">{f}</label>
          <input type="text" className="border rounded px-2 py-1 flex-1" />
        </div>
      ))}
    </div>
  );

  // Save handler
  const handleSave = async () => {
    setSaveLoading(true);
    setSaveSuccess(false);
    setSaveError("");
    try {
      const payload = {
        local: localAgent,
        elevenlabs: elevenLabsAgent
      };
      const res = await fetch(`/api/agents/${agentId}/details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
      } else {
        setSaveError(data?.error || "Failed to save agent.");
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const agentName = localAgent.name || elevenLabsAgent.name || "New agent";
  const agentLanguage = localAgent.language || elevenLabsAgent.language || "en";
  const additionalLanguages = localAgent.additional_languages || elevenLabsAgent.additional_languages || [];
  const firstMessage = localAgent.first_message || elevenLabsAgent.first_message || "";
  const firstMsgVars = localAgent.first_message_vars || elevenLabsAgent.first_message_vars || [];
  const setFirstMsgVars = (vars: string[]) => setLocalAgent((prev: any) => ({ ...prev, first_message_vars: vars }));
  const firstMsgVarInput = "";
  const setFirstMsgVarInput = (input: string) => {};

  const systemPrompt = localAgent.system_prompt || elevenLabsAgent.system_prompt || "";
  const sysPromptVars = localAgent.system_prompt_vars || elevenLabsAgent.system_prompt_vars || [];
  const setSysPromptVars = (vars: string[]) => setLocalAgent((prev: any) => ({ ...prev, system_prompt_vars: vars }));
  const sysPromptVarInput = "";
  const setSysPromptVarInput = (input: string) => {};

  const dynamicVars = localAgent.dynamic_vars || elevenLabsAgent.dynamic_vars || [];
  const setDynamicVars = (vars: string[]) => setLocalAgent((prev: any) => ({ ...prev, dynamic_vars: vars }));
  const dynamicVarInput = "";
  const setDynamicVarInput = (input: string) => {};

  const llm = localAgent.llm || elevenLabsAgent.llm || "gemini-flash";
  const setLlm = (value: string) => setLocalAgent((prev: any) => ({ ...prev, llm: value }));

  const temperature = localAgent.temperature || elevenLabsAgent.temperature || 0.5;
  const setTemperature = (value: number) => setLocalAgent((prev: any) => ({ ...prev, temperature: value }));

  const tokenLimit = localAgent.token_limit || elevenLabsAgent.token_limit || 0;
  const setTokenLimit = (value: number) => setLocalAgent((prev: any) => ({ ...prev, token_limit: value }));

  const useRag = localAgent.use_rag || elevenLabsAgent.use_rag || false;
  const setUseRag = (checked: boolean) => setLocalAgent((prev: any) => ({ ...prev, use_rag: checked }));

  const tools = localAgent.tools || elevenLabsAgent.tools || [];
  const setTools = (values: string[]) => setLocalAgent((prev: any) => ({ ...prev, tools: values }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Agents &gt; {agentName}</div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{agentName}</h1>
            <span className="bg-gray-200 text-xs px-2 py-1 rounded">Public</span>
          </div>
          <div className="text-sm text-gray-500 mb-2">{agentId}</div>
          {/* Replace the tab navigation block with a flex row, underline for active tab, and correct badge placement */}
          <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
            {[
              { label: 'Agent' },
              { label: 'Voice', badge: 'New' },
              { label: 'Analysis' },
              { label: 'Security' },
              { label: 'Advanced' },
              { label: 'Widget', badge: 'New • Chat' },
            ].map((tab, idx) => (
              <button
                key={tab.label}
                className={`relative pb-2 px-0 bg-transparent border-none outline-none text-base font-medium transition-colors duration-150 ${activeTab === tab.label ? 'text-black font-bold' : 'text-gray-500'} flex items-center`}
                style={{ background: 'none', boxShadow: 'none' }}
                onClick={() => setActiveTab(tab.label)}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium" style={{ fontWeight: 500 }}>{tab.badge}</span>
                )}
                {activeTab === tab.label && (
                  <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-black rounded" style={{ width: '100%' }}></span>
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Tab Content */}
        {activeTab === "Agent" && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center text-gray-500">Loading agent data...</div>
            ) : (
              <>
                {/* Agent Language */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Agent Language</div>
                  <div className="text-gray-500 text-sm mb-2">Choose the default language the agent will communicate in.</div>
                  <select
                    value={agentLanguage}
                    onChange={e => setAgentSettings((prev: typeof agentSettings) => ({ ...prev, language: e.target.value }))}
                    className="border rounded px-3 py-2 w-48"
                  >
                    {languages.map(l => (
                      <option key={l.id} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                </div>
                {/* Additional Languages */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Additional Languages</div>
                  <div className="text-gray-500 text-sm mb-2">Specify additional languages which callers can choose from.</div>
                  <select
                    multiple
                    value={additionalLanguages}
                    onChange={e => setAgentSettings((prev: typeof agentSettings) => ({ ...prev, additional_languages: Array.from(e.target.selectedOptions, o => o.value) }))}
                    className="border rounded px-3 py-2 w-64 h-20"
                  >
                    {languages.map(l => (
                      <option key={l.id} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                </div>
                {/* First Message */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">First message</div>
                  <div className="text-gray-500 text-sm mb-2">The first message the agent will say. If empty, the agent will wait for the user to start the conversation.</div>
                  <textarea
                    value={firstMessage}
                    onChange={e => setAgentSettings((prev: typeof agentSettings) => ({ ...prev, first_message: e.target.value }))}
                    className="border rounded px-3 py-2 w-full"
                    placeholder="e.g. Hello! How can I help you today?"
                  />
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {firstMsgVars.map((v: string) => (
                      <span key={v} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1">
                        {v} <button type="button" onClick={() => removeVar(v, firstMsgVars, setFirstMsgVars)} className="text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={firstMsgVarInput}
                      onChange={e => setFirstMsgVarInput(e.target.value)}
                      className="border rounded px-3 py-2 flex-1"
                      placeholder="Add variable"
                    />
                    <button type="button" onClick={() => addVar(firstMsgVarInput, setFirstMsgVarInput, firstMsgVars, setFirstMsgVars)} className="bg-gray-200 px-3 py-2 rounded">+ Add Variable</button>
                  </div>
                </div>
                {/* System Prompt */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">System prompt</div>
                  <div className="text-gray-500 text-sm mb-2">The system prompt is used to determine the persona of the agent and the context of the conversation. <span className="underline cursor-pointer">Learn more</span></div>
                  <textarea
                    value={systemPrompt}
                    onChange={e => setAgentSettings((prev: typeof agentSettings) => ({ ...prev, system_prompt: e.target.value }))}
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Describe the desired agent (e.g., a customer support agent for ElevenLabs)"
                  />
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {sysPromptVars.map((v: string) => (
                      <span key={v} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1">
                        {v} <button type="button" onClick={() => removeVar(v, sysPromptVars, setSysPromptVars)} className="text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={sysPromptVarInput}
                      onChange={e => setSysPromptVarInput(e.target.value)}
                      className="border rounded px-3 py-2 flex-1"
                      placeholder="Add variable"
                    />
                    <button type="button" onClick={() => addVar(sysPromptVarInput, setSysPromptVarInput, sysPromptVars, setSysPromptVars)} className="bg-gray-200 px-3 py-2 rounded">+ Add Variable</button>
                  </div>
                </div>
                {/* Dynamic Variables */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Dynamic Variables</div>
                  <div className="text-gray-500 text-sm mb-2">Variables like <span className="bg-gray-100 px-1 rounded">&#123;&#123;user_name&#125;&#125;</span> in your prompts and first message will be replaced with actual values when the conversation starts. <span className="underline cursor-pointer">Learn more</span></div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {dynamicVars.map((v: string) => (
                      <span key={v} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1">
                        {v} <button type="button" onClick={() => removeVar(v, dynamicVars, setDynamicVars)} className="text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={dynamicVarInput}
                      onChange={e => setDynamicVarInput(e.target.value)}
                      className="border rounded px-3 py-2 flex-1"
                      placeholder="Add dynamic variable"
                    />
                    <button type="button" onClick={() => addVar(dynamicVarInput, setDynamicVarInput, dynamicVars, setDynamicVars)} className="bg-gray-200 px-3 py-2 rounded">+ Add Variable</button>
                  </div>
                </div>
                {/* LLM */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">LLM</div>
                  <div className="text-gray-500 text-sm mb-2">Select which provider and model to use for the LLM.</div>
                  <select
                    value={llm}
                    onChange={e => setLlm(e.target.value)}
                    className="border rounded px-3 py-2 w-64"
                  >
                    {LLM_MODELS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                {/* Temperature */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Temperature</div>
                  <div className="text-gray-500 text-sm mb-2">Temperature is a parameter that controls the creativity or randomness of the responses generated by the LLM.</div>
                  <div className="flex gap-2 mb-2">
                    {tempPresets.map(p => (
                      <button key={p.label} type="button" onClick={() => setTemperature(p.value)} className={`px-3 py-1 rounded ${temperature === p.value ? 'bg-black text-white' : 'bg-gray-200'}`}>{p.label}</button>
                    ))}
                  </div>
                  <input type="range" min={0} max={1} step={0.01} value={temperature} onChange={e => setTemperature(Number(e.target.value))} className="w-full" />
                  <div className="text-xs text-gray-500">Current: {temperature}</div>
                </div>
                {/* Token Limit */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Limit token usage</div>
                  <div className="text-gray-500 text-sm mb-2">Configure the maximum number of tokens that the LLM can predict. A limit will be applied if the value is greater than 0.</div>
                  <input type="number" value={tokenLimit} onChange={e => setTokenLimit(Number(e.target.value))} className="border rounded px-3 py-2 w-32" />
                </div>
                {/* Agent Knowledge Base */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Agent knowledge base</div>
                  <div className="text-gray-500 text-sm mb-2">Provide the LLM with domain-specific information to help it answer questions more accurately.</div>
                  <button type="button" className="bg-gray-200 px-3 py-2 rounded w-fit">Add document</button>
                </div>
                {/* Use RAG */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Use RAG</div>
                  <div className="text-gray-500 text-sm mb-2">Retrieval-Augmented Generation (RAG) increases the agent's maximum Knowledge Base size. The agent will have access to relevant pieces of attached Knowledge Base during answer generation.</div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={useRag} onChange={e => setUseRag(e.target.checked)} /> Enable RAG
                  </label>
                </div>
                {/* Tools */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Tools</div>
                  <div className="text-gray-500 text-sm mb-2">Let the agent perform specific actions.</div>
                  <div className="flex flex-wrap gap-4">
                    {TOOL_OPTIONS.map(tool => (
                      <label key={tool.value} className="flex items-center gap-2">
                        <input type="checkbox" checked={tools.includes(tool.value)} onChange={e => setTools(e.target.checked ? [...tools, tool.value] : tools.filter((t: string) => t !== tool.value))} />
                        {tool.label}
                      </label>
                    ))}
                  </div>
                </div>
                {/* Custom Tools */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Custom tools</div>
                  <div className="text-gray-500 text-sm mb-2">Provide the agent with custom tools it can use to help users.</div>
                  <button type="button" className="bg-gray-200 px-3 py-2 rounded w-fit">Add tool</button>
                </div>
                {/* Custom MCP Servers */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Custom MCP Servers</div>
                  <div className="text-gray-500 text-sm mb-2">Provide the agent with Model Context Protocol servers to extend its capabilities.</div>
                  <button type="button" className="bg-gray-200 px-3 py-2 rounded w-fit">Add Server</button>
                </div>
                {/* Workspace Secrets */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Workspace Secrets</div>
                  <div className="text-gray-500 text-sm mb-2">Create and manage secure secrets that can be accessed across your workspace.</div>
                  <button type="button" className="bg-gray-200 px-3 py-2 rounded w-fit">Add secret</button>
                  <div className="text-xs text-gray-500 mt-1">Used by 1 phone number: Test call</div>
                </div>
                {/* Workspace Auth Connections */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Workspace Auth Connections</div>
                  <div className="text-gray-500 text-sm mb-2">Create and manage authentication connections that can be used across your workspace tools.</div>
                  <button type="button" className="bg-gray-200 px-3 py-2 rounded w-fit">Add auth</button>
                </div>
                {/* Save button and status */}
                <div className="flex items-center gap-4">
                  <button type="button" onClick={handleSave} disabled={saveLoading} className="bg-black text-white px-6 py-2 rounded-lg font-medium">
                    {saveLoading ? "Saving..." : "Save"}
                  </button>
                  {saveSuccess && <span className="text-green-600 text-sm">Saved!</span>}
                  {saveError && <span className="text-red-600 text-sm">{saveError}</span>}
                </div>
              </>
            )}
          </div>
        )}
        {activeTab === "Voice" && (
          <div className="space-y-6">
            {/* Voice tab fields: voice select, multi-voice, use flash, TTS output, pronunciation dictionaries, latency, stability, speed, similarity */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Voice</div>
              <select className="border rounded px-3 py-2 w-64"><option>Eric</option></select>
            </div>
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Multi-voice support <span className="text-xs bg-gray-100 px-2 py-1 rounded ml-2">New</span></div>
              <button className="bg-gray-200 px-3 py-2 rounded w-fit">Add voice</button>
            </div>
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <label className="flex items-center gap-2"><input type="checkbox" /> Use Flash</label>
              <div className="text-xs text-gray-500">Your agent will use Flash v2.</div>
            </div>
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">TTS output format</div>
              <select className="border rounded px-3 py-2 w-64"><option>PCM 16000 Hz</option></select>
            </div>
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Pronunciation Dictionaries</div>
              <button className="bg-gray-200 px-3 py-2 rounded w-fit">Add dictionary</button>
            </div>
            {/* Sliders for latency, stability, speed, similarity */}
            {["Optimize streaming latency", "Stability", "Speed", "Similarity"].map(label => (
              <div key={label} className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                <div className="font-semibold">{label}</div>
                <input type="range" min={0} max={1} step={0.01} className="w-full" />
              </div>
            ))}
          </div>
        )}
        {activeTab === "Widget" && (
          <div className="space-y-6">
            {/* Embed code */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Embed code</div>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1 overflow-x-auto">{'<elevenlabs-convai agent-id="agent_01k041qz7cfy69vj79lyzekm79"></elevenlabs-convai>'}</code>
                <button className="bg-gray-200 px-3 py-1 rounded">Copy</button>
              </div>
            </div>
            {/* Feedback collection */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Feedback collection</div>
              <div className="text-gray-500 text-sm mb-2">Callers will be able to provide feedback continuously during the conversation and after it ends. Information about which agent response caused the feedback will be collected.</div>
              <select className="border rounded px-3 py-2 w-64">
                <option>During conversation</option>
                <option>After conversation</option>
                <option>Never</option>
              </select>
            </div>
            {/* Interface */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Interface</div>
              <div className="text-gray-500 text-sm mb-2">Configure parts of the widget interface.</div>
              <label className="flex items-center gap-2"><input type="checkbox" /> Text input <span className="bg-gray-100 text-xs px-2 py-1 rounded ml-2">New</span></label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Allow switching to text-only mode <span className="bg-gray-100 text-xs px-2 py-1 rounded ml-2">New</span></label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Conversation transcript <span className="bg-gray-100 text-xs px-2 py-1 rounded ml-2">New</span></label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Language dropdown</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Enable muting during a call</label>
            </div>
            {/* Appearance */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Appearance</div>
              <div className="text-gray-500 text-sm mb-2">Customize the widget to best fit your website.</div>
              <div className="flex gap-2 mb-2">
                <button className="bg-gray-200 px-3 py-1 rounded">Tiny</button>
                <button className="bg-gray-200 px-3 py-1 rounded">Compact</button>
                <button className="bg-gray-200 px-3 py-1 rounded">Full</button>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-medium">Placement</label>
                <select className="border rounded px-3 py-2 w-64">
                  <option>Bottom-right</option>
                  <option>Bottom-left</option>
                  <option>Top-right</option>
                  <option>Top-left</option>
                </select>
              </div>
            </div>
            {/* Avatar */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Avatar</div>
              <div className="flex gap-2 mb-2">
                <button className="bg-gray-200 px-3 py-2 rounded">Orb</button>
                <button className="bg-gray-200 px-3 py-2 rounded">Link</button>
                <button className="bg-gray-200 px-3 py-2 rounded">Image</button>
              </div>
              <div className="flex gap-2">
                <div>
                  <div className="text-xs text-gray-500">First color</div>
                  <input type="text" className="border rounded px-2 py-1 w-32" placeholder="#2792DC" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Second color</div>
                  <input type="text" className="border rounded px-2 py-1 w-32" placeholder="#9CE6E6" />
                </div>
              </div>
            </div>
            {/* Theme */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Theme</div>
              <div className="text-xs text-gray-500 mb-2">Modify the colors and style of your widget.</div>
              {renderColorFields()}
              {renderRadiusFields()}
            </div>
            {/* Text contents */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Text contents</div>
              <div className="text-xs text-gray-500 mb-2">Modify the text displayed in the widget.</div>
              {renderTextContents()}
            </div>
            {/* Terms and conditions */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <label className="flex items-center gap-2 mb-2">
                <input type="checkbox" /> Terms and conditions
                <span className="text-gray-500 text-sm">Require the caller to accept your terms and conditions before initiating a call.</span>
              </label>
              <div className="flex flex-col gap-2">
                <label className="font-medium">Terms content</label>
                <textarea className="border rounded px-3 py-2 w-full" rows={4} placeholder="#### Terms and conditions\nBy clicking 'Agree', ..." />
                <label className="font-medium">Local storage key</label>
                <input type="text" className="border rounded px-2 py-1 w-64" placeholder="e.g. terms.accepted" />
              </div>
            </div>
            {/* Shareable Page */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Shareable Page</div>
              <div className="text-gray-500 text-sm mb-2">Configure the page shown when people visit your shareable link.</div>
              <label className="font-medium">Description</label>
              <input type="text" className="border rounded px-2 py-1 w-full" placeholder="Chat with AI" />
              <label className="flex items-center gap-2 mt-2">
                <input type="checkbox" /> Require visitors to accept our terms
              </label>
            </div>
          </div>
        )}
        {activeTab === "Advanced" && (
          <div className="space-y-6">
            {/* Turn timeout */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Turn timeout</div>
              <div className="text-gray-500 text-sm mb-2">The maximum number of seconds since the user last spoke. If exceeded, the agent will respond and force a turn. A value of -1 means the agent will never timeout and always wait for a response from the user.</div>
              <input type="number" className="border rounded px-2 py-1 w-32" placeholder="7" />
            </div>
            {/* Silence end call timeout */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Silence end call timeout</div>
              <div className="text-gray-500 text-sm mb-2">The maximum number of seconds since the user last spoke. If exceeded, the call will terminate. A value of -1 means there is no fixed cutoff.</div>
              <input type="number" className="border rounded px-2 py-1 w-32" placeholder="20" />
            </div>
            {/* Max conversation duration */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Max conversation duration</div>
              <div className="text-gray-500 text-sm mb-2">The maximum number of seconds that a conversation can last.</div>
              <input type="number" className="border rounded px-2 py-1 w-32" placeholder="300" />
            </div>
            {/* Keywords */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Keywords</div>
              <div className="text-gray-500 text-sm mb-2">Define a comma-separated list of keywords that have a higher likelihood of being predicted correctly.</div>
              <input type="text" className="border rounded px-2 py-1 w-full" placeholder="keyword1, keyword2" />
            </div>
            {/* Text only toggle */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Text only
                <span className="text-gray-500 text-sm">If enabled audio will not be processed and only text will be used.</span>
              </label>
            </div>
            {/* User input audio format */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">User input audio format</div>
              <div className="text-gray-500 text-sm mb-2">Select the input format you want to use for automatic speech recognition.</div>
              <select className="border rounded px-3 py-2 w-64">
                <option>PCM 16000 Hz</option>
                <option>PCM 8000 Hz</option>
                <option>WAV</option>
              </select>
            </div>
            {/* Client Events */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Client Events</div>
              <div className="text-gray-500 text-sm mb-2">Select the events that should be sent to the client.</div>
              <div className="flex flex-wrap gap-2">
                {["audio", "interruption", "user_transcript", "agent_response", "agent_response_correction"].map(ev => (
                  <span key={ev} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1 cursor-pointer">{ev} <button className="text-red-500">×</button></span>
                ))}
              </div>
            </div>
            {/* Privacy Settings */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Privacy Settings</div>
              <div className="text-gray-500 text-sm mb-2">This section allows you to configure the privacy settings for the agent.</div>
              <label className="flex items-center gap-2"><input type="checkbox" /> Store Call Audio</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Zero-PII Retention Mode <span className="text-xs text-gray-400">&#9432;</span></label>
            </div>
            {/* Conversations Retention Period */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Conversations Retention Period</div>
              <div className="text-gray-500 text-sm mb-2">Set the number of days to keep conversations (-1 for unlimited).</div>
              <input type="number" className="border rounded px-2 py-1 w-32" placeholder="730" />
            </div>
            {/* Delete Transcript and Derived Fields, Delete Audio */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <label className="flex items-center gap-2"><input type="checkbox" /> Delete Transcript and Derived Fields (PII)</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Delete Audio</label>
            </div>
          </div>
        )}
        {activeTab === "Security" && (
          <div className="space-y-6">
            {/* Enable authentication */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Enable authentication
                <span className="text-gray-500 text-sm">Require users to authenticate before connecting to the agent.</span>
              </label>
            </div>
            {/* Allowlist */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Allowlist</div>
              <div className="text-gray-500 text-sm mb-2">Specify the hosts that will be allowed to connect to this agent.</div>
              <div className="flex gap-2 mb-2">
                <input type="text" className="border rounded px-2 py-1 flex-1" placeholder="Add host..." />
                <button className="bg-gray-200 px-3 py-2 rounded">Add host</button>
              </div>
              <div className="text-xs text-gray-500">No allowlist specified. Any host will be able to connect to this agent.</div>
            </div>
            {/* Enable overrides */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Enable overrides</div>
              <div className="text-gray-500 text-sm mb-2">Choose which parts of the config can be overridden by the client at the start of the conversation.</div>
              {['Agent language', 'First message', 'System prompt', 'Voice', 'Text only'].map(f => (
                <label key={f} className="flex items-center gap-2"><input type="checkbox" /> {f}</label>
              ))}
            </div>
            {/* Fetch initiation client data from webhook */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Fetch initiation client data from webhook
                <span className="text-gray-500 text-sm">If enabled, the conversation initiation client data will be fetched from the webhook defined in the settings when receiving Twilio or SIP trunk calls.</span>
              </label>
            </div>
            {/* Post-Call Webhook */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Post-Call Webhook</div>
              <div className="flex gap-2 mb-2">
                <button className="bg-gray-200 px-3 py-2 rounded">Create Webhook</button>
              </div>
              <div className="text-xs text-gray-500">Override the post-call webhook configured in settings for this agent.</div>
            </div>
            {/* Enable bursting */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Enable bursting
                <span className="text-gray-500 text-sm">If enabled, the agent can exceed the workspace subscription concurrency limit by up to 3 times, with excess calls charged at double the normal rate.</span>
              </label>
            </div>
            {/* Concurrent Calls Limit */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Concurrent Calls Limit</div>
              <div className="text-gray-500 text-sm mb-2">The maximum number of concurrent calls allowed. Matching the subscription concurrency limit.</div>
              <input type="number" className="border rounded px-2 py-1 w-32" placeholder="-1" />
            </div>
            {/* Daily Calls Limit */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Daily Calls Limit</div>
              <div className="text-gray-500 text-sm mb-2">The maximum number of calls allowed per day.</div>
              <input type="number" className="border rounded px-2 py-1 w-32" placeholder="100000" />
            </div>
          </div>
        )}
        {activeTab === "Analysis" && (
          <div className="space-y-6">
            {/* Analysis tab fields: evaluation criteria, data collection */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Evaluation criteria</div>
              <button className="bg-gray-200 px-3 py-2 rounded w-fit">Add criteria</button>
            </div>
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Data collection</div>
              <button className="bg-gray-200 px-3 py-2 rounded w-fit">Add item</button>
            </div>
          </div>
        )}
        {/* New • Chat tab can be scaffolded similarly */}
      </div>
    </div>
  );
} 