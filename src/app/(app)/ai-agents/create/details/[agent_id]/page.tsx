"use client";
import { useParams } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import Select, { components } from 'react-select';
import type { MultiValue, ActionMeta, OptionProps } from 'react-select';
import NewCustomMcpServerDrawer from '../../../../../../components/ai-agents/NewCustomMcpServerDrawer';
import useElevenLabsTools from './useElevenLabsTools';
import { api } from "@/lib/apiConfig";
import languages from '@/data/languages.json';
import { FaBrain, FaTrash } from 'react-icons/fa';
import WebhookModal from '@/components/ui/WebhookModal';
import { useToast } from '@/components/ui/use-toast';
import { Edit2, Copy, Check, ChevronsUpDown, Lock, X } from 'lucide-react';

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
];
const LLM_MODELS = [
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
  { value: "2025-04-14", label: "2025-04-14" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
  { value: "claude-sonnet-4", label: "Claude Sonnet 4" },
  { value: "claude-3.7-sonnet", label: "Claude 3.7 Sonnet" },
  { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "custom-llm", label: "Custom LLM" },
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

interface AddVariableDropdownProps {
  onSelect: (variable: string) => void;
  onClose: () => void;
}
function AddVariableDropdown({ onSelect, onClose }: AddVariableDropdownProps) {
  // Slightly larger text and dropdown
  return (
    <div
      className="absolute z-20 bg-white border rounded shadow-md mt-1 w-48 text-[12px]"
      style={{ maxHeight: 140, overflowY: 'auto', minWidth: 160 }}
    >
      <div className="px-3 py-2 text-[11px] text-gray-500">System Variables</div>
      {["system_agent_id", "system_caller_id", "system_called_number", "system_call_duration_secs", "system_time_utc", "system_time", "system_timezone", "system_conversation_id", "system_call_sid"].map(v => (
        <div
          key={v}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[12px]"
          onClick={() => { onSelect(v); onClose(); }}
        >
          {v}
        </div>
      ))}
      <div className="px-3 py-2 text-blue-600 hover:bg-gray-100 cursor-pointer text-[12px] border-t" onClick={() => { onSelect("new_variable"); onClose(); }}>
        New Variable
      </div>
    </div>
  );
}

interface VariableTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  dropdownButtonLabel?: string;
  showTimezoneButton?: boolean;
  variables: string[];
  setVariables: (vars: string[]) => void;
}

const COMMON_TIMEZONES = [
  "UTC",
  "Eastern Time (US)",
  "Central Time (US)",
  "Mountain Time (US)",
  "Pacific Time (US)",
  "London",
  "Paris/Berlin",
  "Amsterdam",
  "Tokyo",
  "Shanghai",
  "India",
  "Sydney",
  "Auckland"
];

interface TimezoneDropdownProps {
  onSelect: (tz: string) => void;
  onClose: () => void;
}
function TimezoneDropdown({ onSelect, onClose }: TimezoneDropdownProps) {
  const [search, setSearch] = React.useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filtered = COMMON_TIMEZONES.filter(tz => tz.toLowerCase().includes(search.toLowerCase()));

  // Close on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div ref={dropdownRef} className="absolute z-30 bg-white border rounded shadow-md mt-1 w-64 text-[12px]" style={{ maxHeight: 240, overflowY: 'auto', minWidth: 160 }}>
      <div className="px-3 pt-2 pb-1">
        <input
          className="w-full border rounded px-3 py-2 text-[12px]"
          placeholder="Search timezones..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="px-3 pb-1 text-gray-500 text-[11px]">Common Timezones</div>
      {filtered.length === 0 && <div className="px-3 py-2 text-gray-400 text-[12px]">No results</div>}
      {filtered.map(tz => (
        <div
          key={tz}
          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-[12px]"
          onClick={() => { onSelect(tz); onClose(); }}
        >
          {tz}
        </div>
      ))}
    </div>
  );
}

function extractVariablesFromText(text: string) {
  // Match all {{variable}} in the text
  const matches = text.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  // Remove the curly braces
  return Array.from(new Set(matches.map(m => m.slice(2, -2))));
}

function VariableTextarea({ value, onChange, placeholder, dropdownButtonLabel = "+ Add Variable", showTimezoneButton = false }: Omit<VariableTextareaProps, 'variables' | 'setVariables'>) {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = React.useState(false);
  const [showCustomVarInput, setShowCustomVarInput] = React.useState(false);
  const [customVarName, setCustomVarName] = React.useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Dropdown position logic to prevent overflow
  const [dropdownStyle, setDropdownStyle] = React.useState<any>({});
  const [timezoneDropdownStyle, setTimezoneDropdownStyle] = React.useState<any>({});

  React.useEffect(() => {
    if (showDropdown && textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      const dropdownHeight = 150;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownStyle({ bottom: '100%', top: 'auto', marginBottom: 4 });
      } else {
        setDropdownStyle({ top: '100%', bottom: 'auto', marginTop: 4 });
      }
    }
    if (showTimezoneDropdown && textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      const dropdownHeight = 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setTimezoneDropdownStyle({ bottom: '100%', top: 'auto', marginBottom: 4, left: 120 });
      } else {
        setTimezoneDropdownStyle({ top: '100%', bottom: 'auto', marginTop: 4, left: 120 });
      }
    }
  }, [showDropdown, showTimezoneDropdown]);

  // Focus custom input when shown
  React.useEffect(() => {
    if (showCustomVarInput && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [showCustomVarInput]);

  // Close both dropdowns on outside click
  React.useEffect(() => {
    if (!showDropdown && !showTimezoneDropdown && !showCustomVarInput) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node) &&
        (!customInputRef.current || !customInputRef.current.contains(e.target as Node))
      ) {
        setShowDropdown(false);
        setShowTimezoneDropdown(false);
        setShowCustomVarInput(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDropdown, showTimezoneDropdown, showCustomVarInput]);

  // Chips are always extracted from textarea value
  const variables = extractVariablesFromText(value);

  const handleVariableSelect = (variable: string) => {
    if (variable === "new_variable") {
      setShowDropdown(false);
      setShowCustomVarInput(true);
      setCustomVarName("");
      return;
    }
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const insertText = `{{${variable}}}`;
    const newValue = value.slice(0, start) + insertText + value.slice(end);
    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
    }, 0);
  };

  const handleCustomVarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const varName = customVarName.trim();
    if (!varName.match(/^[_a-zA-Z][_a-zA-Z0-9]*$/)) return; // Only allow valid variable names
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const insertText = `{{${varName}}}`;
    const newValue = value.slice(0, start) + insertText + value.slice(end);
    onChange(newValue);
    setShowCustomVarInput(false);
    setCustomVarName("");
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
    }, 0);
  };

  const handleTimezone = () => {
    setShowTimezoneDropdown(v => !v);
  };

  const handleTimezoneSelect = (tz: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const insertText = `{{${tz}}}`;
    const newValue = value.slice(0, start) + insertText + value.slice(end);
    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + insertText.length;
    }, 0);
  };

  const handleRemoveVar = (v: string) => {
    // Remove all occurrences of the variable template from the textarea
    const regex = new RegExp(`\\{\\{${v}\\}\\}`, 'g');
    onChange(value.replace(regex, ''));
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border rounded px-3 py-2 w-full text-[12px]"
        placeholder={placeholder}
        style={{ minHeight: 40, maxHeight: 100 }}
      />
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-[12px] relative"
          style={{ minWidth: 100, height: 32 }}
          onClick={() => setShowDropdown(v => !v)}
        >
          {dropdownButtonLabel}
        </button>
        {showTimezoneButton && (
          <button
            type="button"
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-[12px]"
            style={{ minWidth: 100, height: 32 }}
            onClick={handleTimezone}
          >
            Add timezone
          </button>
        )}
      </div>
      {showCustomVarInput && (
        <form onSubmit={handleCustomVarSubmit} className="flex gap-2 mt-2 items-center">
          <input
            ref={customInputRef}
            type="text"
            value={customVarName}
            onChange={e => setCustomVarName(e.target.value)}
            className="border rounded px-2 py-1 text-[12px]"
            placeholder="Enter variable name"
            maxLength={32}
            pattern="^[_a-zA-Z][_a-zA-Z0-9]*$"
            required
          />
          <button type="submit" className="px-2 py-1 bg-black text-white rounded text-[12px]">Add</button>
        </form>
      )}
      {/* Variable chips */}
      <div className="flex gap-2 mt-2 flex-wrap">
        {variables.map((v) => (
          <span key={v} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center gap-1">
            {v} <button type="button" onClick={() => handleRemoveVar(v)} className="text-red-500">×</button>
          </span>
        ))}
      </div>
      {showDropdown && (
        <div ref={dropdownRef} className="absolute left-0" style={dropdownStyle}>
          <AddVariableDropdown onSelect={handleVariableSelect} onClose={() => setShowDropdown(false)} />
        </div>
      )}
      {showTimezoneDropdown && (
        <div className="absolute" style={timezoneDropdownStyle}>
          <TimezoneDropdown onSelect={handleTimezoneSelect} onClose={() => setShowTimezoneDropdown(false)} />
        </div>
      )}
    </div>
  );
}

// Utility to recursively remove null/undefined from objects/arrays
function cleanPayload(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(cleanPayload);
  } else if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== null && v !== undefined)
        .map(([k, v]) => [k, cleanPayload(v)])
    );
  }
  return obj;
}

// Helper to check if a string is a valid IANA timezone (basic check: contains '/')
function isValidIanaTimezone(tz: string | undefined): boolean {
  return typeof tz === 'string' && tz.includes('/') && tz.length > 3;
}

// Built-in/system tools (always available)
const BUILT_IN_TOOLS = [
  {
    name: "end_call",
    label: "End call",
    description: "Gives agent the ability to end the call with the user.",
    params: { system_tool_type: "end_call" },
    type: "system"
  },
  {
    name: "language_detection",
    label: "Detect language",
    description: "Gives agent the ability to change the language during conversation.",
    params: { system_tool_type: "language_detection" },
    type: "system"
  },
  {
    name: "skip_turn",
    label: "Skip turn",
    description: "Agent will skip its turn if user explicitly indicates they need a moment.",
    params: { system_tool_type: "skip_turn" },
    type: "system"
  },
  {
    name: "transfer_to_agent",
    label: "Transfer to agent",
    description: "Gives agent the ability to transfer the call to another AI agent.",
    params: { system_tool_type: "transfer_to_agent" },
    type: "system"
  },
  {
    name: "transfer_to_number",
    label: "Transfer to number",
    description: "Gives agent the ability to transfer the call to a human.",
    params: { system_tool_type: "transfer_to_number" },
    type: "system"
  },
  {
    name: "play_keypad_touch_tone",
    label: "Play keypad touch tone",
    description: "Gives agent the ability to play keypad touch tones during a phone call.",
    params: { system_tool_type: "play_keypad_touch_tone" },
    type: "system"
  },
];

function buildElevenLabsPayload({
  agentSettings,
  widgetConfig,
  voiceConfig,
  advancedConfig,
  securityConfig,
  analysisConfig,
  firstMessage,
  systemPrompt,
  elevenLabsAgent,
  allTools // <-- pass allTools here
}: any) {
  // Determine TTS model_id for English and non-English agents
  let ttsModelId = voiceConfig.model_id;
  let lang = agentSettings.language || '';
  // Always extract the base language code for ElevenLabs (e.g., "en-US" -> "en")
  if (lang && lang.includes('-')) {
    lang = lang.split('-')[0];
  }
  if (lang.startsWith('en')) {
    ttsModelId = 'eleven_turbo_v2';
  } else {
    ttsModelId = 'eleven_turbo_v2_5';
  }
  // Only include enabled tools in built_in_tools, with full API structure and valid name
  const builtInTools: any = {};
  if (agentSettings.tools.includes('end_call')) builtInTools.end_call = {
    name: "end_call", // must match ^[a-zA-Z0-9_-]{1,64}$
    description: "Gives agent the ability to end the call with the user.",
    params: { system_tool_type: "end_call" },
    response_timeout_secs: 20,
    type: "system"
  };
  if (agentSettings.tools.includes('language_detection')) builtInTools.language_detection = {
    name: "language_detection",
    description: "Gives agent the ability to change the language during conversation.",
    params: { system_tool_type: "language_detection" },
    response_timeout_secs: 20,
    type: "system"
  };
  if (agentSettings.tools.includes('transfer_to_agent')) builtInTools.transfer_to_agent = {
    name: "transfer_to_agent",
    description: "Gives agent the ability to transfer the call to another AI agent.",
    params: { system_tool_type: "transfer_to_agent" },
    response_timeout_secs: 20,
    type: "system"
  };
  if (agentSettings.tools.includes('transfer_to_number')) builtInTools.transfer_to_number = {
    name: "transfer_to_number",
    description: "Gives agent the ability to transfer the call to a human.",
    params: { system_tool_type: "transfer_to_number" },
    response_timeout_secs: 20,
    type: "system"
  };
  if (agentSettings.tools.includes('skip_turn')) builtInTools.skip_turn = {
    name: "skip_turn",
    description: "Agent will skip its turn if user explicitly indicates they need a moment.",
    params: { system_tool_type: "skip_turn" },
    response_timeout_secs: 20,
    type: "system"
  };
  if (agentSettings.tools.includes('play_keypad_touch_tone')) builtInTools.play_keypad_touch_tone = {
    name: "play_keypad_touch_tone",
    description: "Gives agent the ability to play keypad touch tones during a phone call.",
    params: { system_tool_type: "play_keypad_touch_tone" },
    response_timeout_secs: 20,
    type: "system"
  };
  // ... rest of buildElevenLabsPayload as before ...

  // Build prompt object with conditional fields
  const enabledBuiltInTools = BUILT_IN_TOOLS.filter(tool => agentSettings.tools.includes(tool.name));
  const enabledCustomTools = (agentSettings.tools || []).map((t: string) => allTools.find((tool: any) => tool.name === t)).filter((tool: any) => tool && !BUILT_IN_TOOLS.some(b => b.name === tool.name));
  const enabledTools = [...enabledBuiltInTools, ...enabledCustomTools];
  const prompt: any = {
    prompt: systemPrompt,
    llm: agentSettings.llm,
    temperature: agentSettings.temperature,
    max_tokens: agentSettings.token_limit,
    tool_ids: agentSettings.tool_ids,
    mcp_server_ids: agentSettings.mcp_server_ids,
    native_mcp_server_ids: agentSettings.native_mcp_server_ids,
    knowledge_base: agentSettings.knowledge_base,
    ignore_default_personality: agentSettings.ignore_default_personality,
    rag: agentSettings.rag,
    tools: enabledTools, // use full tool objects
  };
  // Only add built_in_tools if at least one tool is enabled
  if (Object.keys(builtInTools).length > 0) {
    prompt.built_in_tools = builtInTools;
  }
  // Only add custom_llm if using custom-llm and url is present
  if (agentSettings.llm === 'custom-llm' && agentSettings.custom_llm_url) {
    prompt.custom_llm = {
      url: agentSettings.custom_llm_url,
      model_id: agentSettings.custom_llm_model_id,
      api_key: agentSettings.custom_llm_api_key,
      headers: agentSettings.custom_llm_headers,
    };
  }
  // Only add timezone if it's a valid IANA string
  if (isValidIanaTimezone(agentSettings.timezone)) {
    prompt.timezone = agentSettings.timezone;
  }

  // Build language_presets from additional_languages
  const language_presets: any = {};
  if (agentSettings.additional_languages && Array.isArray(agentSettings.additional_languages)) {
    agentSettings.additional_languages.forEach((langCode: string) => {
      const cleanLangCode = langCode.split('-')[0]; // Remove country code if present
      language_presets[cleanLangCode] = {
        first_message_translation: {
          text: firstMessage, // Use the same first message for all languages
          source_hash: "" // Required field by ElevenLabs API
        },
        overrides: {} // Required field for language presets
      };
    });
  }
  console.log('[DEBUG] Building language_presets for ElevenLabs:', language_presets);

  return {
    agent_id: elevenLabsAgent.agent_id,
    name: agentSettings.name || elevenLabsAgent.name,
    conversation_config: {
      agent: {
        first_message: firstMessage,
        language: lang,
        dynamic_variables: advancedConfig.dynamic_variables,
        prompt,
      },
      tts: {
        model_id: ttsModelId,
        voice_id: voiceConfig.voice,
        stability: voiceConfig.stability,
        speed: voiceConfig.speed,
        similarity_boost: voiceConfig.similarity,
        agent_output_audio_format: voiceConfig.tts_output_format,
        optimize_streaming_latency: voiceConfig.latency,
        pronunciation_dictionary_locators: voiceConfig.pronunciation_dictionaries,
      },
      asr: {
        user_input_audio_format: advancedConfig.user_input_audio_format,
        keywords: advancedConfig.keywords,
        quality: advancedConfig.asr_quality,
        provider: advancedConfig.asr_provider,
      },
      turn: {
        turn_timeout: advancedConfig.turn_timeout,
        silence_end_call_timeout: advancedConfig.silence_end_call_timeout,
        mode: advancedConfig.turn_mode,
      },
      conversation: {
        text_only: advancedConfig.text_only,
        max_duration_seconds: advancedConfig.max_conversation_duration,
        client_events: advancedConfig.client_events,
      },
      language_presets: language_presets,
    },
    platform_settings: {
      widget: {
        placement: widgetConfig.placement,
        feedback_mode: widgetConfig.feedback_collection,
        text_input_enabled: widgetConfig.text_input,
        transcript_enabled: widgetConfig.conversation_transcript,
        mic_muting_enabled: widgetConfig.enable_muting,
        language_selector: widgetConfig.language_dropdown,
        supports_text_only: widgetConfig.switch_to_text_only,
        // ...add more widget fields as needed
      },
      auth: {
        enable_auth: securityConfig.enable_authentication,
        allowlist: securityConfig.allowlist,
      },
      evaluation: {
        criteria: analysisConfig.evaluation_criteria,
      },
      privacy: {
        record_voice: advancedConfig.privacy_settings?.store_call_audio,
        zero_retention_mode: advancedConfig.privacy_settings?.zero_ppi_retention_mode,
        retention_days: advancedConfig.conversations_retention_period,
        delete_transcript_and_pii: advancedConfig.delete_transcript_and_derived_fields,
        delete_audio: advancedConfig.delete_audio,
      },
      call_limits: {
        agent_concurrency_limit: securityConfig.concurrent_calls_limit,
        daily_limit: securityConfig.daily_calls_limit,
        bursting_enabled: securityConfig.enable_bursting,
      },
      // ...add more platform_settings as needed
    },
    // ...add more top-level fields as needed
  };
}

// Helper to get country code from language code (e.g., 'en' -> 'us', 'hi' -> 'in')
function getCountryCode(langCode: string) {
  // Map language codes to country codes for FlagCDN
  const map: Record<string, string> = {
    en: 'us',
    hi: 'in',
    es: 'es',
    fr: 'fr',
    ar: 'ae',
    zh: 'cn',
    de: 'de',
    ru: 'ru',
    pt: 'pt',
    ja: 'jp',
    ko: 'kr',
    it: 'it',
    nl: 'nl',
    tr: 'tr',
    pl: 'pl',
    sv: 'se',
    ms: 'my',
    ro: 'ro',
    uk: 'ua',
    el: 'gr',
    cs: 'cz',
    da: 'dk',
    fi: 'fi',
    bg: 'bg',
    hr: 'hr',
    sk: 'sk',
    ta: 'in',
    vi: 'vn',
    no: 'no',
    hu: 'hu',
    'pt-br': 'br',
    // Add more as needed
  };
  return map[langCode.toLowerCase()] || langCode.toLowerCase();
}

// Helper to add a knowledge base item to ElevenLabs and local DB
async function addKnowledgeBaseItem(type: 'url' | 'text' | 'file', payload: any, apiKey: string, localDbPayload: any) {
  let endpoint = '';
  if (type === 'url') endpoint = 'https://api.elevenlabs.io/v1/convai/knowledge-base/url';
  if (type === 'text') endpoint = 'https://api.elevenlabs.io/v1/convai/knowledge-base/text';
  if (type === 'file') endpoint = 'https://api.elevenlabs.io/v1/convai/knowledge-base/file';

  // 1. Post to ElevenLabs
  const elevenRes = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const elevenData = await elevenRes.json();

  // 2. Save to your local DB (use your actual API call)
  if (typeof api !== 'undefined' && api.createKnowledgeBaseItem) {
    await api.createKnowledgeBaseItem(localDbPayload);
  }

  return elevenData;
}

function getFlagUrl(code: string) {
  if (!code) return '';
  const lang = languages.find(l =>
    l.code.toLowerCase() === code.toLowerCase() ||
    l.code.toLowerCase().startsWith(code.toLowerCase() + '-') ||
    l.countryCode?.toLowerCase() === code.toLowerCase()
  );
  const country = lang?.countryCode?.toLowerCase() || code.toLowerCase();
  return `https://flagcdn.com/24x18/${country}.png`;
}

function getLanguageName(code: string) {
  if (!code) return code;
  const lower = code.toLowerCase();
  const lang = languages.find(l => l.code.toLowerCase() === lower);
  if (lang) return lang.name;
  // Try to match by country code
  const foundByCountry = languages.find(l => l.countryCode?.toLowerCase() === lower);
  if (foundByCountry) return foundByCountry.name;
  // Try to match by prefix
  const prefix = lower.split('-')[0];
  const foundByPrefix = languages.find(l => l.code.toLowerCase().startsWith(prefix));
  if (foundByPrefix) return foundByPrefix.name;
  return code;
}

// At the top of the file/component:
const elevenLabsBaseUrl = process.env.NEXT_PUBLIC_ELEVENLABS_API_BASE || 'http://localhost:5000';
const localApiBase = typeof window !== 'undefined' ? window.location.origin : '';

// Helper to truncate text
function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n - 1) + '...' : str;
}

const CLIENT_EVENT_OPTIONS = [
  { value: 'audio', label: 'audio' },
  { value: 'interruption', label: 'interruption' },
  { value: 'user_transcript', label: 'user_transcript' },
  { value: 'agent_response', label: 'agent_response' },
  { value: 'agent_response_correction', label: 'agent_response_correction' },
  { value: 'agent_tool_response', label: 'agent_tool_response' },
  { value: 'vad_score', label: 'vad_score' },
];

// Add at the top, after imports:
interface EnableOverrides {
  conversation_config_override: {
    tts: {
      voice_id: boolean;
    };
    conversation: {
      text_only: boolean;
    };
    agent: {
      first_message: boolean;
      language: boolean;
      prompt: {
        prompt: boolean;
      };
    };
  };
}

export default function AgentDetailsPage() {
  const { toast } = useToast();
  const params = useParams();
  const agentId = params.agent_id;
  const [localAgent, setLocalAgent] = useState<any>({});
  const [elevenLabsAgent, setElevenLabsAgent] = useState<any>({});
  const [languages, setLanguages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Add these state hooks at the top of the component
  const [firstMessage, setFirstMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  // New state variables for rename, copy ID, and client change functionality
  const [isRenaming, setIsRenaming] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isChangingClient, setIsChangingClient] = useState(false);
  
  // Workspace secrets state
  const [showAddSecretModal, setShowAddSecretModal] = useState(false);
  const [secretName, setSecretName] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [isAddingSecret, setIsAddingSecret] = useState(false);
  const [workspaceSecrets, setWorkspaceSecrets] = useState<any[]>([]);
  
  // Widget settings state
  const [widgetSettings, setWidgetSettings] = useState({
    feedback_mode: 'during',
    embed_code: ''
  });
  const [widgetSettingsLoading, setWidgetSettingsLoading] = useState(false);

  // 1. Add state for all fields in every tab (Voice, Widget, Advanced, Security, Analysis)
  const [agentSettings, setAgentSettings] = useState({
    language: "en",
    additional_languages: [] as string[],
    first_message: "",
    llm: "",
    temperature: 0.5,
    token_limit: 0,
    tool_ids: [] as any[],
    built_in_tools: {} as any,
    mcp_server_ids: [] as any[],
    native_mcp_server_ids: [] as any[],
    knowledge_base: [] as any[],
    custom_llm: null as any,
    ignore_default_personality: false,
    rag: {} as any,
    timezone: null as any,
    tools: [] as any[],
    custom_llm_url: "",
    custom_llm_model_id: "",
    custom_llm_api_key: "",
    custom_llm_headers: [] as { type: string; name: string; secret: string }[],
    enable_overrides: {
      conversation_config_override: {
        tts: {
          voice_id: false,
        },
        conversation: {
          text_only: false,
        },
        agent: {
          first_message: false,
          language: false,
          prompt: {
            prompt: false,
          },
        },
      },
    },
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
    feedback_collection: "during",
    text_input: false,
    switch_to_text_only: false,
    conversation_transcript: false,
    language_dropdown: false,
    enable_muting: false,
    placement: "Bottom-right",
    require_terms: false,
    require_visitor_terms: false,
  });
  const [voiceConfig, setVoiceConfig] = useState({
    model_id: 'eleven_turbo_v2',
    voice: "Eric",
    multi_voice: false,
    use_flash: false,
    tts_output_format: "PCM 16000 Hz",
    pronunciation_dictionaries: [] as { pronunciation_dictionary_id: string; version_id: string }[],
    latency: 0.5,
    stability: 0.5,
    speed: 0.5,
    similarity: 0.5,
    multi_voice_ids: [] as string[],
  });
  const [securityConfig, setSecurityConfig] = useState<{
    enable_authentication: boolean;
    allowlist: string[];
    enable_overrides: EnableOverrides;
    fetch_initiation_client_data: boolean;
    post_call_webhook: string;
    enable_bursting: boolean;
    concurrent_calls_limit: number;
    daily_calls_limit: number;
    allowlistInput: string;
  }>({
    enable_authentication: false,
    allowlist: [],
    enable_overrides: {
      conversation_config_override: {
        tts: {
          voice_id: false,
        },
        conversation: {
          text_only: false,
        },
        agent: {
          first_message: false,
          language: false,
          prompt: {
            prompt: false,
          },
        },
      },
    },
    fetch_initiation_client_data: false,
    post_call_webhook: "",
    enable_bursting: false,
    concurrent_calls_limit: -1,
    daily_calls_limit: 100000,
    allowlistInput: "",
  });
  const [advancedConfig, setAdvancedConfig] = useState<{
    turn_timeout: number;
    silence_end_call_timeout: number;
    max_conversation_duration: number;
    keywords: string[];
    text_only: boolean;
    user_input_audio_format: string;
    client_events: string[];
    privacy_settings: { store_call_audio: boolean; zero_ppi_retention_mode: boolean };
    conversations_retention_period: number;
    delete_transcript_and_derived_fields: boolean;
    delete_audio: boolean;
  }>({
    turn_timeout: 7,
    silence_end_call_timeout: 20,
    max_conversation_duration: 300,
    keywords: [], // now an array
    text_only: false,
    user_input_audio_format: "pcm_16000",
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

  // Add at the top of the component
  const [showMcpDialog, setShowMcpDialog] = useState(false);
  const [showNewMcpForm, setShowNewMcpForm] = useState(false);
  const [showMcpDrawer, setShowMcpDrawer] = useState(false);
  const [mcpServers, setMcpServers] = useState(agentSettings.mcp_server_ids || []);

  // Use the ElevenLabs tools hook
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
  const {
    tools: allTools,
    loading: toolsLoading,
    error: toolsError,
    fetchTools,
    createTool,
    updateTool,
    deleteTool,
  } = useElevenLabsTools(apiKey);

  // Fetch tools on mount
  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

    // Fetch agent details from backend (which fetches from ElevenLabs and local DB)
  useEffect(() => {
    setLoading(true);
    fetch(`/api/agents/${agentId}/details`)
      .then(res => res.json())
      .then(data => {
        setLocalAgent(data.local || {});
        setElevenLabsAgent(data.elevenlabs || {});
        // Ensure additional_languages is always an array
        if (data.local && typeof data.local.additional_languages === 'string') {
          try {
            data.local.additional_languages = JSON.parse(data.local.additional_languages);
          } catch {
            data.local.additional_languages = [];
          }
        }
        // Prefill all config states from ElevenLabs API data
        const el = data.elevenlabs || {};
        const cc = el.conversation_config || {};
        const agent = cc.agent || {};
        const tts = cc.tts || {};
        const widget = (el.platform_settings && el.platform_settings.widget) || {};
        const privacy = (el.platform_settings && el.platform_settings.privacy) || {};
        const call_limits = (el.platform_settings && el.platform_settings.call_limits) || {};
        const auth = (el.platform_settings && el.platform_settings.auth) || {};
        const evaluation = (el.platform_settings && el.platform_settings.evaluation) || {};
        // Parse language_presets from ElevenLabs to get additional languages
        const language_presets = data.elevenlabs.conversation_config?.language_presets || {};
        console.log('[DEBUG] Language presets from ElevenLabs:', language_presets);
        const additional_languages = Object.keys(language_presets).map(langCode => {
          // Find the full language code by matching first two letters (only if languages are loaded)
          const fullLang = languages.length > 0 ? 
            languages.find(l => l.code.substring(0, 2).toLowerCase() === langCode.toLowerCase()) : 
            null;
          return fullLang ? fullLang.code : langCode;
        });
        console.log('[DEBUG] Parsed additional languages:', additional_languages);
        
        // Also check if there are any first_message_translations we should use
        const firstMessageFromPresets = Object.values(language_presets).find((preset: any) => 
          (preset as any).first_message_translation?.text
        );
        if ((firstMessageFromPresets as any)?.first_message_translation?.text) {
          console.log('[DEBUG] Found first message from language presets:', (firstMessageFromPresets as any).first_message_translation.text);
        }

        // Map ElevenLabs language code to full language code from our languages list
        setAgentSettings(prev => ({
          ...prev,
          language: data?.local?.language_code || prev.language || 'en-US',
          additional_languages: additional_languages.length > 0 ? additional_languages : (data?.local?.additional_languages || prev.additional_languages || []),
          llm: data.elevenlabs.conversation_config?.agent?.prompt?.llm || data?.local?.llm || prev.llm || '',
          temperature: (typeof data.elevenlabs.conversation_config?.agent?.prompt?.temperature === 'number' ? data.elevenlabs.conversation_config.agent.prompt.temperature : undefined)
            ?? (typeof data?.local?.temperature === 'number' ? data.local.temperature : undefined)
            ?? (typeof prev.temperature === 'number' ? prev.temperature : 0.5),
          token_limit: (typeof data.elevenlabs.conversation_config?.agent?.prompt?.max_tokens === 'number' ? data.elevenlabs.conversation_config.agent.prompt.max_tokens : undefined)
            ?? (typeof data?.local?.token_limit === 'number' ? data.local.token_limit : undefined)
            ?? (typeof prev.token_limit === 'number' ? prev.token_limit : -1),
          first_message: data.elevenlabs.conversation_config?.agent?.first_message || data?.local?.first_message || prev.first_message || '',
          // system_prompt: data.elevenlabs.conversation_config?.agent?.prompt?.prompt || data?.local?.system_prompt || prev.system_prompt || '',
          tools: data.elevenlabs.conversation_config?.agent?.tools || data.elevenlabs.conversation_config?.agent?.prompt?.tool_ids || data?.local?.tools || prev.tools || [],
          custom_llm: agent.prompt?.custom_llm || data?.local?.custom_llm || prev.custom_llm || null,
          ignore_default_personality: agent.prompt?.ignore_default_personality ?? data?.local?.ignore_default_personality ?? prev.ignore_default_personality ?? false,
          rag: agent.prompt?.rag || data?.local?.rag || prev.rag || {},
          timezone: agent.prompt?.timezone || data?.local?.timezone || prev.timezone || null,
          custom_llm_url: agent.custom_llm_url || data?.local?.custom_llm_url || prev.custom_llm_url || '',
          custom_llm_model_id: agent.custom_llm_model_id || data?.local?.custom_llm_model_id || prev.custom_llm_model_id || '',
          custom_llm_api_key: agent.custom_llm_api_key || data?.local?.custom_llm_api_key || prev.custom_llm_api_key || '',
          custom_llm_headers: agent.custom_llm_headers || data?.local?.custom_llm_headers || prev.custom_llm_headers || [],
          enable_overrides: (auth.enable_overrides && typeof auth.enable_overrides === 'object') ? {
            conversation_config_override: {
              tts: {
                voice_id: !!auth.enable_overrides.conversation_config_override?.tts?.voice_id,
              },
              conversation: {
                text_only: !!auth.enable_overrides.conversation_config_override?.conversation?.text_only,
              },
              agent: {
                first_message: !!auth.enable_overrides.conversation_config_override?.agent?.first_message,
                language: !!auth.enable_overrides.conversation_config_override?.agent?.language,
                prompt: {
                  prompt: !!auth.enable_overrides.conversation_config_override?.agent?.prompt?.prompt,
                },
              },
            },
          } : {
            conversation_config_override: {
              tts: {
                voice_id: false,
              },
              conversation: {
                text_only: false,
              },
              agent: {
                first_message: false,
                language: false,
                prompt: {
                  prompt: false,
                },
              },
            },
          },
          built_in_tools: agent.prompt?.built_in_tools || data?.local?.built_in_tools || prev.built_in_tools || {},
          mcp_server_ids: agent.prompt?.mcp_server_ids || data?.local?.mcp_server_ids || prev.mcp_server_ids || [],
          native_mcp_server_ids: agent.prompt?.native_mcp_server_ids || data?.local?.native_mcp_server_ids || prev.native_mcp_server_ids || [],
          knowledge_base: agent.prompt?.knowledge_base || data?.local?.knowledge_base || prev.knowledge_base || [],
        }));
        
        // Populate selectedDocs with agent's existing knowledge base items
        const agentKnowledgeBase = agent.prompt?.knowledge_base || data?.local?.knowledge_base || [];
        if (Array.isArray(agentKnowledgeBase) && agentKnowledgeBase.length > 0) {
          console.log(`[Agent Details] Found ${agentKnowledgeBase.length} knowledge base items for agent ${agentId}:`, {
            agentId,
            knowledgeBaseItems: agentKnowledgeBase,
            timestamp: new Date().toISOString()
          });
          
          // Map the knowledge base items to the format expected by selectedDocs
          const mappedDocs = agentKnowledgeBase.map((kbItem: any) => ({
            id: String(kbItem.id), // Ensure ID is always a string
            name: kbItem.name,
            type: kbItem.type,
            url: kbItem.url,
            usage_mode: kbItem.usage_mode,
            icon: kbItem.type === 'url' ? '🌐' : kbItem.type === 'text' ? '📝' : '📄'
          }));
          
          setSelectedDocs(mappedDocs);
          
          console.log(`[Agent Details] Populated selectedDocs for agent ${agentId}:`, {
            agentId,
            selectedDocsCount: mappedDocs.length,
            selectedDocs: mappedDocs,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log(`[Agent Details] No knowledge base items found for agent ${agentId}`, {
            agentId,
            timestamp: new Date().toISOString()
          });
          setSelectedDocs([]);
        }
        
        console.log('ElevenLabs API response:', data.elevenlabs);
        setFirstMessage(agent?.first_message || '');
        setSystemPrompt(agent?.prompt?.prompt || '');
        setWidgetConfig({
          voice: widget.voice || '',
          multi_voice: widget.multi_voice || false,
          use_flash: widget.use_flash || false,
          tts_output_format: widget.tts_output_format || 'PCM 16000 Hz',
          pronunciation_dictionaries: widget.pronunciation_dictionaries || [],
          latency: widget.latency || 0.5,
          stability: widget.stability || 0.5,
          speed: widget.speed || 0.5,
          similarity: widget.similarity || 0.5,
          feedback_collection: widget.feedback_mode || 'during',
          text_input: widget.text_input_enabled || false,
          conversation_transcript: widget.transcript_enabled || false,
          enable_muting: widget.mic_muting_enabled || false,
          language_dropdown: widget.language_selector || false,
          switch_to_text_only: widget.supports_text_only || false,
          placement: widget.placement || 'bottom-right',
          require_terms: widget.require_terms || false,
          require_visitor_terms: widget.require_visitor_terms || false,
        });
        setVoiceConfig({
          model_id: tts.model_id || 'eleven_turbo_v2',
          voice: tts.voice_id || '',
          multi_voice: tts.multi_voice || false,
          use_flash: tts.use_flash || false,
          tts_output_format: tts.agent_output_audio_format || 'PCM 16000 Hz',
          pronunciation_dictionaries: tts.pronunciation_dictionary_locators || [],
          latency: tts.optimize_streaming_latency || 0.5,
          stability: tts.stability || 0.5,
          speed: tts.speed || 1,
          similarity: tts.similarity_boost || 0.5,
          multi_voice_ids: tts.multi_voice_ids || [],
        });
        setAdvancedConfig({
          turn_timeout: cc.turn?.turn_timeout || 7,
          silence_end_call_timeout: cc.turn?.silence_end_call_timeout || 20,
          max_conversation_duration: cc.conversation?.max_duration_seconds || 300,
          keywords: cc.asr?.keywords || [], // now an array
          text_only: cc.conversation?.text_only || false,
          user_input_audio_format: cc.asr?.user_input_audio_format || 'pcm_16000',
          client_events: cc.conversation?.client_events || [],
          privacy_settings: {
            store_call_audio: privacy.record_voice || false,
            zero_ppi_retention_mode: privacy.zero_retention_mode || false,
          },
          conversations_retention_period: privacy.retention_days || 730,
          delete_transcript_and_derived_fields: privacy.delete_transcript_and_pii || false,
          delete_audio: privacy.delete_audio || false,
        });
        setSecurityConfig({
          enable_authentication: auth.enable_auth || false,
          allowlist: auth.allowlist || [],
          enable_overrides: (auth.enable_overrides && typeof auth.enable_overrides === 'object') ? {
            conversation_config_override: {
              tts: {
                voice_id: !!auth.enable_overrides.conversation_config_override?.tts?.voice_id,
              },
              conversation: {
                text_only: !!auth.enable_overrides.conversation_config_override?.conversation?.text_only,
              },
              agent: {
                first_message: !!auth.enable_overrides.conversation_config_override?.agent?.first_message,
                language: !!auth.enable_overrides.conversation_config_override?.agent?.language,
                prompt: {
                  prompt: !!auth.enable_overrides.conversation_config_override?.agent?.prompt?.prompt,
                },
              },
            },
          } : {
            conversation_config_override: {
              tts: {
                voice_id: false,
              },
              conversation: {
                text_only: false,
              },
              agent: {
                first_message: false,
                language: false,
                prompt: {
                  prompt: false,
                },
              },
            },
          },
          fetch_initiation_client_data: false, // map as needed
          post_call_webhook: '', // map as needed
          enable_bursting: call_limits.bursting_enabled || false,
          concurrent_calls_limit: call_limits.agent_concurrency_limit || -1,
          daily_calls_limit: call_limits.daily_limit || 100000,
          allowlistInput: auth.allowlistInput || '',
        });
        setAnalysisConfig({
          evaluation_criteria: evaluation.criteria || [],
          data_collection: [], // map as needed
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // Fetch languages from backend
    fetch('/api/languages')
      .then(res => res.json())
      .then(data => {
        console.log('Languages API response:', data);
        setLanguages(data.data || []);
      })
      .catch(err => console.error('Error fetching languages:', err));
  }, [agentId]);

  // Handle language mapping when languages are loaded
  useEffect(() => {
    if (languages.length > 0 && elevenLabsAgent?.conversation_config?.agent?.language) {
      const elevenLabsLangCode = elevenLabsAgent.conversation_config.agent.language;
      console.log('ElevenLabs code:', elevenLabsLangCode);
      console.log('Languages state length:', languages.length);
      
      // Use languages state to find matching code by first two letters
      const fullLanguageCode = languages.find((l: any) => l.code.substring(0, 2).toLowerCase() === elevenLabsLangCode.toLowerCase())?.code;
      console.log('Found language code:', fullLanguageCode);
      
      if (fullLanguageCode) {
        setAgentSettings(prev => ({
          ...prev,
          language: fullLanguageCode
        }));
      }
    }
  }, [languages, elevenLabsAgent]);

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

  // Save handler: PATCH to backend, which updates both local DB and ElevenLabs
  const handleSave = async () => {
    if (
      advancedConfig.privacy_settings.store_call_audio &&
      advancedConfig.privacy_settings.zero_ppi_retention_mode
    ) {
      alert("You cannot enable both 'Store Call Audio' and 'Zero Retention Mode' at the same time.");
      return;
    }
    setSaveLoading(true);
    setSaveSuccess(false);
    setSaveError("");
    try {
              // Update agentSettings with selectedDocs for knowledge base
        const updatedAgentSettings = {
          ...agentSettings,
          knowledge_base: selectedDocs.map(doc => ({
            id: String(doc.id), // Ensure ID is a string for ElevenLabs API
            name: doc.name,
            type: doc.type,
            url: doc.url,
            usage_mode: doc.usage_mode || 'auto'
          }))
        };
      
              console.log(`[Agent Details] Saving agent ${agentId} with knowledge base:`, {
          agentId,
          selectedDocsCount: selectedDocs.length,
          knowledgeBase: updatedAgentSettings.knowledge_base,
          knowledgeBaseTypes: updatedAgentSettings.knowledge_base.map(kb => ({
            id: kb.id,
            idType: typeof kb.id,
            name: kb.name,
            type: kb.type
          })),
          timestamp: new Date().toISOString()
        });
      
      // Map UI state to correct ElevenLabs structure
      const localPayload = {
        language_code: updatedAgentSettings.language,
        additional_languages: updatedAgentSettings.additional_languages,
        llm: updatedAgentSettings.llm,
        custom_llm_url: updatedAgentSettings.custom_llm_url,
        custom_llm_model_id: updatedAgentSettings.custom_llm_model_id,
        custom_llm_api_key: updatedAgentSettings.custom_llm_api_key,
        custom_llm_headers: updatedAgentSettings.custom_llm_headers,
        temperature: updatedAgentSettings.temperature,
        token_limit: updatedAgentSettings.token_limit,
        first_message: firstMessage,
        system_prompt: systemPrompt,
        language_id: languages.find(l => l.code === updatedAgentSettings.language)?.id || null,
      };
      // Build ElevenLabs payload, including custom LLM fields if selected
      const elevenLabsPayload = buildElevenLabsPayload({
        agentSettings: updatedAgentSettings,
        widgetConfig,
        voiceConfig,
        advancedConfig,
        securityConfig,
        analysisConfig,
        firstMessage,
        systemPrompt,
        elevenLabsAgent,
        allTools
      });
      if (updatedAgentSettings.llm === 'custom-llm') {
        if (!elevenLabsPayload.conversation_config.agent.prompt.custom_llm) {
          elevenLabsPayload.conversation_config.agent.prompt.custom_llm = {};
        }
        elevenLabsPayload.conversation_config.agent.prompt.custom_llm.url = updatedAgentSettings.custom_llm_url;
        elevenLabsPayload.conversation_config.agent.prompt.custom_llm.model_id = updatedAgentSettings.custom_llm_model_id;
        elevenLabsPayload.conversation_config.agent.prompt.custom_llm.api_key = updatedAgentSettings.custom_llm_api_key;
        elevenLabsPayload.conversation_config.agent.prompt.custom_llm.headers = updatedAgentSettings.custom_llm_headers;
      }
      // Clean the payload to remove null/undefined
      const cleanedPayload = cleanPayload(elevenLabsPayload);
      const payload = {
        local: localPayload,
        elevenlabs: cleanedPayload
      };
      console.log('PATCH payload to backend:', payload); // Debug log
      const res = await fetch(`/api/agents/${agentId}/details`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Save knowledge base mappings to database
        console.log(`[Agent Details] Saving knowledge base mappings to database for agent ${agentId}:`, {
          agentId,
          selectedDocs,
          timestamp: new Date().toISOString()
        });
        
        try {
          const dbResponse = await fetch(`/api/agents/${agentId}/knowledge-base-db`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              knowledgeBaseItems: selectedDocs
            })
          });
          
          const dbData = await dbResponse.json();
          
          if (dbResponse.ok && dbData.success) {
            console.log(`[Agent Details] Successfully saved knowledge base mappings to database for agent ${agentId}:`, {
              agentId,
              dbResponse: dbData,
              timestamp: new Date().toISOString()
            });
          } else {
            console.error(`[Agent Details] Failed to save knowledge base mappings to database for agent ${agentId}:`, {
              agentId,
              dbError: dbData.error,
              timestamp: new Date().toISOString()
            });
          }
        } catch (dbError) {
          console.error(`[Agent Details] Error saving knowledge base mappings to database for agent ${agentId}:`, {
            agentId,
            dbError: dbError instanceof Error ? dbError.message : dbError,
            timestamp: new Date().toISOString()
          });
        }
        
        // Also save advanced settings to local DB
        await fetch(`/api/agents/${agentId}/advanced-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            turn_timeout: advancedConfig.turn_timeout,
            silence_end_call_timeout: advancedConfig.silence_end_call_timeout,
            max_conversation_duration: advancedConfig.max_conversation_duration,
            keywords: advancedConfig.keywords,
            text_only: advancedConfig.text_only,
            user_input_audio_format: advancedConfig.user_input_audio_format,
            client_events: advancedConfig.client_events,
            privacy_settings: advancedConfig.privacy_settings,
            conversations_retention_period: advancedConfig.conversations_retention_period,
            delete_transcript_and_derived_fields: advancedConfig.delete_transcript_and_derived_fields,
            delete_audio: advancedConfig.delete_audio
          })
        });
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
  const firstMsgVars = localAgent.first_message_vars || elevenLabsAgent.first_message_vars || [];
  const setFirstMsgVars = (vars: string[]) => setLocalAgent((prev: any) => ({ ...prev, first_message_vars: vars }));
  const firstMsgVarInput = "";
  const setFirstMsgVarInput = (input: string) => {};

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

  // Filter enabled languages only
  const enabledLanguages = languages.filter((l: any) => l.enabled);

  // Prepare options with just the language name for react-select, but use country_code for internal flag logic if needed
  const languageOptions = enabledLanguages.map(l => ({
    value: l.code,
    label: (
      <span style={{ display: 'flex', alignItems: 'center' }}>
        {l.country_code && (
          <img
            src={`https://flagcdn.com/24x18/${l.country_code.toLowerCase()}.png`}
            alt="flag"
            style={{ width: 24, height: 18, marginRight: 8, borderRadius: 2, objectFit: 'cover', background: '#eee' }}
          />
        )}
        {l.name}
      </span>
    ),
    flag: l.country_code ? l.country_code.toLowerCase() : '',
    name: l.name,
  }));

  // Agent Language: default to 'en' if not set, persist selection
  const agentLanguageValue = agentSettings.language || 'en';

  // Additional Languages: persist selection, allow multiple
  const additionalLanguagesValue = agentSettings.additional_languages || [];

  // For each tab, bind all fields to the correct state and update state on change
  // Example for Agent tab:
  // <select value={agentSettings.language} onChange={e => setAgentSettings(prev => ({ ...prev, language: e.target.value }))} ... />

  // State for document picker
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<any[]>([]);
  const [docTypeFilter, setDocTypeFilter] = useState<{ file: boolean; url: boolean; text: boolean }>({ file: false, url: false, text: false });
  const [openDialog, setOpenDialog] = useState<null | 'url' | 'files' | 'text'>(null);
  const docPickerRef = useRef<HTMLDivElement>(null);

  // Close document picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (docPickerRef.current && !docPickerRef.current.contains(e.target as Node)) {
        setShowDocPicker(false);
      }
    }
    if (showDocPicker) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDocPicker]);

  // Fetch documents from ElevenLabs Knowledge Base API on mount
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch('https://api.elevenlabs.io/v1/convai/knowledge-base', {
          headers: {
            'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch documents');
        const data = await res.json();
        console.log('ElevenLabs KB API response:', data); // Debug log
        let docs: any[] = [];
        if (Array.isArray(data)) {
          docs = data;
        } else if (data && Array.isArray(data.documents)) {
          docs = data.documents;
        } else if (data && Array.isArray(data.knowledge_bases)) {
          docs = data.knowledge_bases;
        } else if (data && Array.isArray(data.items)) {
          docs = data.items;
        }
        setAvailableDocs(docs);
      } catch (e) {
        setAvailableDocs([]);
      }
    };
    fetchDocs();
  }, []);

  const [docTypeDropdownOpen, setDocTypeDropdownOpen] = useState(false);

  // Add document dialog handlers
  const [addDocLoading, setAddDocLoading] = useState(false);
  const [addUrlInput, setAddUrlInput] = useState("");
  const [addTextName, setAddTextName] = useState("");
  const [addTextContent, setAddTextContent] = useState("");
  const [addFile, setAddFile] = useState<File | null>(null);

  async function handleAddUrl() {
    setAddDocLoading(true);
    try {
      const localDbPayload = {
        client_id: null, // client_id can be nullable
        type: "url",
        name: addUrlInput,
        url: addUrlInput,
        file_path: null,
        text_content: null,
        size: null,
        created_by: "user@example.com", // replace with actual user email
      };
      await addKnowledgeBaseItem('url', { url: addUrlInput, name: addUrlInput }, apiKey, localDbPayload);
      setAddUrlInput("");
      setOpenDialog(null);
      // Optionally refresh availableDocs here
    } finally {
      setAddDocLoading(false);
    }
  }
  async function handleAddText() {
    setAddDocLoading(true);
    try {
      const localDbPayload = {
        client_id: null, // client_id can be nullable
        type: "text",
        name: addTextName,
        url: null,
        file_path: null,
        text_content: addTextContent,
        size: `${addTextContent.length} chars`,
        created_by: "user@example.com", // replace with actual user email
      };
      await addKnowledgeBaseItem('text', { name: addTextName, text: addTextContent }, apiKey, localDbPayload);
      setAddTextName("");
      setAddTextContent("");
      setOpenDialog(null);
      // Optionally refresh availableDocs here
    } finally {
      setAddDocLoading(false);
    }
  }
  async function handleAddFile() {
    if (!addFile) return;
    setAddDocLoading(true);
    try {
      const localDbPayload = {
        client_id: null, // client_id can be nullable
        type: "file",
        name: addFile.name,
        url: null,
        file_path: "/uploads/" + addFile.name, // replace with actual upload logic
        text_content: null,
        size: `${(addFile.size / 1024).toFixed(1)} kB`,
        created_by: "user@example.com", // replace with actual user email
      };
      await addKnowledgeBaseItem('file', { name: addFile.name }, apiKey, localDbPayload);
      setAddFile(null);
      setOpenDialog(null);
      // Optionally refresh availableDocs here
    } finally {
      setAddDocLoading(false);
    }
  }

  // Add at the top of AgentDetailsPage
  const [elevenVoices, setElevenVoices] = useState<any[]>([]);
  const [multiVoices, setMultiVoices] = useState<string[]>(voiceConfig.multi_voice_ids || []);
  const [voicesLoading, setVoicesLoading] = useState(false);

  // 2. Fetch voices on mount
  useEffect(() => {
    setVoicesLoading(true);
    api.elevenLabs.getVoices(process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY)
      .then(async (res: Response) => {
        const data = await res.json();
        setElevenVoices(data.voices || []);
      })
      .catch(() => setElevenVoices([]))
      .finally(() => setVoicesLoading(false));
  }, []);

  // 3. Fetch backend voice settings
  async function fetchVoiceSettingsFromBackend() {
    try {
      const res = await fetch(`/api/agents/${agentId}/voice-settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setVoiceConfig(prev => ({ ...prev, ...data.data, pronunciation_dictionaries: data.data.pronunciation_dictionary_locators ? JSON.parse(data.data.pronunciation_dictionary_locators) : [], multi_voice_ids: data.data.multi_voice_ids ? JSON.parse(data.data.multi_voice_ids) : [] }));
          setMultiVoices(data.data.multi_voice_ids ? JSON.parse(data.data.multi_voice_ids) : []);
        }
      }
    } catch {}
  }

  // 4. Fetch both ElevenLabs and backend settings on mount/tab switch
  useEffect(() => {
    if (activeTab === 'Voice') {
      fetchElevenLabsAgentDetails();
      fetchVoiceSettingsFromBackend();
    }
    if (activeTab === 'Widget') {
      fetchWidgetSettings();
    }
  }, [activeTab, agentId]);

  // Add state for voice tab loading and save status
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceSaveLoading, setVoiceSaveLoading] = useState(false);
  const [voiceSaveSuccess, setVoiceSaveSuccess] = useState(false);
  const [voiceSaveError, setVoiceSaveError] = useState("");

  // Helper to fetch latest agent details from ElevenLabs and update voiceConfig
  async function fetchElevenLabsAgentDetails() {
    setVoiceLoading(true);
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        
        // Set ElevenLabs agent data
        setElevenLabsAgent(data);
        
        // Update voice config
        const tts = data?.conversation_config?.tts || {};
        setVoiceConfig(prev => ({
          ...prev,
          model_id: tts.model_id || 'eleven_turbo_v2',
          voice: tts.voice_id || '',
          tts_output_format: tts.agent_output_audio_format || 'PCM 16000 Hz',
          latency: tts.optimize_streaming_latency ?? 0.5,
          stability: tts.stability ?? 0.5,
          speed: tts.speed ?? 1,
          similarity: tts.similarity_boost ?? 0.5,
          pronunciation_dictionaries: tts.pronunciation_dictionary_locators || [],
          multi_voice_ids: tts.multi_voice_ids || [],
        }));
        
        // Update widget config with feedback collection from ElevenLabs
        const widget = data?.platform_settings?.widget || {};
        setWidgetConfig(prev => ({
          ...prev,
          feedback_collection: widget.feedback_mode || 'during',
        }));
      }
    } finally {
      setVoiceLoading(false);
    }
  }

  // Fetch widget settings from ElevenLabs
  async function fetchWidgetSettings() {
    if (!agentId) return;
    setWidgetSettingsLoading(true);
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        
        // Update widget config with feedback collection from ElevenLabs
        const widget = data?.platform_settings?.widget || {};
        const feedbackMode = widget.feedback_mode || 'during';
        
        setWidgetConfig(prev => ({
          ...prev,
          feedback_collection: feedbackMode,
        }));
        
        // Update widget settings state with ElevenLabs data
        setWidgetSettings({
          feedback_mode: feedbackMode,
          embed_code: `<elevenlabs-convai agent-id="${data.agent_id || agentId}"></elevenlabs-convai><script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>`
        });
      }
    } catch (error) {
      console.error('Error fetching widget settings from ElevenLabs:', error);
    } finally {
      setWidgetSettingsLoading(false);
    }
  }

  // 5. Save handler for Voice tab
  async function handleSaveVoice() {
    setVoiceSaveLoading(true);
    setVoiceSaveSuccess(false);
    setVoiceSaveError("");
    try {
      const ttsPayload = {
        conversation_config: {
          tts: {
            model_id: voiceConfig.model_id,
            voice_id: voiceConfig.voice,
            agent_output_audio_format: voiceConfig.tts_output_format,
            optimize_streaming_latency: Math.max(0, Math.min(4, Math.round(voiceConfig.latency))),
            stability: voiceConfig.stability,
            speed: Math.min(voiceConfig.speed, 1.2),
            similarity_boost: voiceConfig.similarity,
            ...(Array.isArray(voiceConfig.pronunciation_dictionaries) && voiceConfig.pronunciation_dictionaries.length > 0
              ? { pronunciation_dictionary_locators: voiceConfig.pronunciation_dictionaries }
              : {}),
            ...(Array.isArray(voiceConfig.multi_voice_ids) && voiceConfig.multi_voice_ids.length > 0
              ? { multi_voice_ids: voiceConfig.multi_voice_ids }
              : {}),
          }
        }
      };
      // Save to ElevenLabs
      const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ttsPayload),
      });
      // Save to backend DB
      await fetch(`/api/agents/${agentId}/voice-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_id: voiceConfig.model_id,
          voice_id: voiceConfig.voice,
          tts_output_format: voiceConfig.tts_output_format,
          optimize_streaming_latency: Math.max(0, Math.min(4, Math.round(voiceConfig.latency))),
          stability: voiceConfig.stability,
          speed: Math.min(voiceConfig.speed, 1.2),
          similarity_boost: voiceConfig.similarity,
          pronunciation_dictionary_locators: voiceConfig.pronunciation_dictionaries,
          multi_voice_ids: voiceConfig.multi_voice_ids,
        }),
      });
      if (res.ok) {
        setVoiceSaveSuccess(true);
        await fetchElevenLabsAgentDetails();
        await fetchVoiceSettingsFromBackend();
      } else {
        const err = await res.json();
        setVoiceSaveError(err?.error || 'Failed to update voice config');
      }
    } catch (e) {
      setVoiceSaveError('Network error. Please try again.');
    } finally {
      setVoiceSaveLoading(false);
    }
  }

  // At the top of the component
  const fileInputRef = useRef<HTMLInputElement>(null);
  function handleAddDictionaryFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.6 * 1024 * 1024) {
      alert('File too large (max 1.6MB)');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    fetch('/api/elevenlabs/pronunciation-dictionary', {
      method: 'POST',
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        if (data.pronunciation_dictionary_id && data.version_id) {
          setVoiceConfig(prev => ({
            ...prev,
            pronunciation_dictionaries: [
              ...(prev.pronunciation_dictionaries || []),
              { pronunciation_dictionary_id: data.pronunciation_dictionary_id, version_id: data.version_id }
            ]
          }));
          // Optionally, save to backend as before (call handleSaveVoice or similar)
        } else {
          alert('Failed to upload dictionary: ' + (data.error || 'Unknown error'));
        }
      })
      .catch(() => alert('Failed to upload dictionary'));
  }

  // --- Add state and handlers for Analysis tab (copied from client-admin panel) ---
  const [showCriteriaOverlay, setShowCriteriaOverlay] = useState(false);
  const [showDataOverlay, setShowDataOverlay] = useState(false);
  const [criteriaName, setCriteriaName] = useState("");
  const [criteriaPrompt, setCriteriaPrompt] = useState("");
  const [dataType, setDataType] = useState("String");
  const [dataIdentifier, setDataIdentifier] = useState("");
  const [dataDescription, setDataDescription] = useState("");
  const [criteriaList, setCriteriaList] = useState<{ name: string; prompt: string }[]>([]);
  const [dataItemList, setDataItemList] = useState<{ type: string; identifier: string; description: string }[]>([]);
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  const [dataItemLoading, setDataItemLoading] = useState(false);
  const [criteriaError, setCriteriaError] = useState("");
  const [dataItemError, setDataItemError] = useState("");

  // Fetch on mount/tab switch
  useEffect(() => {
    if (String(activeTab).trim().toLowerCase() !== "analysis") return;
    setCriteriaLoading(true);
    setDataItemLoading(true);
    setCriteriaError("");
    setDataItemError("");
    fetch(`/api/agents/${agentId}/analysis`)
      .then(res => res.json())
      .then(data => {
        setCriteriaList((data.criteria || []).map((c: any) => ({ name: c.name, prompt: c.prompt })));
        setDataItemList((data.data_collection || []).map((d: any) => ({ type: d.data_type, identifier: d.identifier, description: d.description })));
      })
      .catch(() => {
        setCriteriaError("Failed to fetch analysis data");
        setDataItemError("Failed to fetch analysis data");
      })
      .finally(() => {
        setCriteriaLoading(false);
        setDataItemLoading(false);
      });
  }, [activeTab, agentId]);

  // Add criteria
  async function handleAddCriteriaSubmit() {
    const newCriteria = { name: criteriaName, prompt: criteriaPrompt };
    if (!criteriaName.trim() || !criteriaPrompt.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    if (criteriaList.some(c => c.name === newCriteria.name)) {
      alert('A criteria with this name already exists for this agent.');
      return;
    }
    const updatedList = [...criteriaList, newCriteria];
    setCriteriaList(updatedList);
    setShowCriteriaOverlay(false);
    setCriteriaName("");
    setCriteriaPrompt("");
    // PATCH to ElevenLabs
    try {
      await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", 'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '' },
        body: JSON.stringify({ platform_settings: { evaluation: { criteria: updatedList } } })
      });
    } catch {}
    // POST to local DB
    try {
      await fetch(`/api/agents/${agentId}/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria: updatedList, data_collection: dataItemList })
      });
      alert('Criteria added successfully!');
    } catch {
      alert('Failed to add criteria.');
    }
  }
  // Add data item
  async function handleAddDataItemSubmit() {
    const newItem = { type: dataType, identifier: dataIdentifier, description: dataDescription };
    if (!dataType.trim() || !dataIdentifier.trim() || !dataDescription.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    if (dataItemList.some(d => d.identifier === newItem.identifier)) {
      alert('A data item with this identifier already exists for this agent.');
      return;
    }
    const updatedList = [...dataItemList, newItem];
    setDataItemList(updatedList);
    setShowDataOverlay(false);
    setDataType("String");
    setDataIdentifier("");
    setDataDescription("");
    // PATCH to ElevenLabs
    try {
      await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", 'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '' },
        body: JSON.stringify({ platform_settings: { data_collection: updatedList } })
      });
    } catch {}
    // POST to local DB
    try {
      await fetch(`/api/agents/${agentId}/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria: criteriaList, data_collection: updatedList })
      });
      alert('Data item added successfully!');
    } catch {
      alert('Failed to add data item.');
    }
  }
  // Delete handlers
  function handleDeleteCriteria(name: string) {
    if (!window.confirm('Are you sure you want to delete this criteria?')) return;
    fetch(`/api/agents/${agentId}/analysis/criteria?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete');
        setCriteriaList(prev => prev.filter(c => c.name !== name));
        alert('Criteria deleted successfully!');
      })
      .catch(() => alert('Failed to delete criteria.'));
  }
  function handleDeleteDataItem(identifier: string) {
    if (!window.confirm('Are you sure you want to delete this data item?')) return;
    fetch(`/api/agents/${agentId}/analysis/data-item?identifier=${encodeURIComponent(identifier)}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete');
        setDataItemList(prev => prev.filter(d => d.identifier !== identifier));
        alert('Data item deleted successfully!');
      })
      .catch(() => alert('Failed to delete data item.'));
  }
  // ... existing code ...

  // Add at the top of the component, after other useState hooks
  const [newClientEvent, setNewClientEvent] = useState("");

  // Add this near the top of the component, after other useState hooks
  const [keywordsInput, setKeywordsInput] = useState(advancedConfig.keywords.join(", "));
  useEffect(() => {
    setKeywordsInput(advancedConfig.keywords.join(", "));
  }, [advancedConfig.keywords]);

  // Add at the top of AgentDetailsPage (after other useState hooks)
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securitySaveLoading, setSecuritySaveLoading] = useState(false);
  const [securitySaveSuccess, setSecuritySaveSuccess] = useState(false);
  const [securitySaveError, setSecuritySaveError] = useState("");

  // Fetch security settings from ElevenLabs when Security tab is activated
  useEffect(() => {
    if (activeTab !== 'Security') return;
    setSecurityLoading(true);
    fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      headers: {
        'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        const auth = data?.platform_settings?.auth || {};
        const call_limits = data?.platform_settings?.call_limits || {};
        const overrides = data?.platform_settings?.overrides || {}; // Look under platform_settings
        console.log('[DEBUG] Fetched overrides from ElevenLabs:', overrides);
        setSecurityConfig({
          enable_authentication: auth.enable_auth || false,
          allowlist: Array.isArray(auth.allowlist)
            ? (auth.allowlist as any[]).map((h: any) => typeof h === 'string' ? h : (h && typeof h.hostname === 'string' ? h.hostname : ''))
            : [],
          enable_overrides: (overrides && typeof overrides === 'object') ? {
            conversation_config_override: {
              tts: {
                voice_id: !!overrides.conversation_config_override?.tts?.voice_id,
              },
              conversation: {
                text_only: !!overrides.conversation_config_override?.conversation?.text_only,
              },
              agent: {
                first_message: !!overrides.conversation_config_override?.agent?.first_message,
                language: !!overrides.conversation_config_override?.agent?.language,
                prompt: {
                  prompt: !!overrides.conversation_config_override?.agent?.prompt?.prompt,
                },
              },
            },
          } : {
            conversation_config_override: {
              tts: {
                voice_id: false,
              },
              conversation: {
                text_only: false,
              },
              agent: {
                first_message: false,
                language: false,
                prompt: {
                  prompt: false,
                },
              },
            },
          },
          fetch_initiation_client_data: false, // map as needed
          post_call_webhook: '', // map as needed
          enable_bursting: call_limits.bursting_enabled || false,
          concurrent_calls_limit: call_limits.agent_concurrency_limit || -1,
          daily_calls_limit: call_limits.daily_limit || 100000,
          allowlistInput: auth.allowlistInput || '',
        });
      })
      .catch((err) => { console.error('[DEBUG] Error fetching security config:', err); })
      .finally(() => setSecurityLoading(false));
  }, [activeTab, agentId]);

  // Save handler for Security tab
  async function handleSaveSecurity() {
    setSecuritySaveLoading(true);
    setSecuritySaveSuccess(false);
    setSecuritySaveError("");
    try {
      const payload = {
        platform_settings: {
          auth: {
            enable_auth: securityConfig.enable_authentication,
            allowlist: securityConfig.allowlist.filter(Boolean), // always array of strings
          },
          call_limits: {
            bursting_enabled: securityConfig.enable_bursting,
            agent_concurrency_limit: securityConfig.concurrent_calls_limit,
            daily_limit: securityConfig.daily_calls_limit,
          },
          overrides: securityConfig.enable_overrides, // Try nesting under platform_settings
        },
      };
      console.log('[DEBUG] PATCH payload to ElevenLabs:', payload);
      const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('[DEBUG] PATCH response from ElevenLabs:', data);
      if (res.ok) {
        setSecuritySaveSuccess(true);
      } else {
        setSecuritySaveError(data?.error || 'Failed to update security settings');
      }
    } catch (e) {
      setSecuritySaveError('Network error. Please try again.');
    } finally {
      setSecuritySaveLoading(false);
    }
  }

  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [currentWebhook, setCurrentWebhook] = useState<{id: string, name: string, url: string, auth_method?: string} | null>(null);
  const [sendAudio, setSendAudio] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);

  // Fetch current webhook assignment when component loads
  useEffect(() => {
    if (agentId) {
      setWebhookLoading(true);
      fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
      })
        .then(res => res.json())
        .then(data => {
          console.log('[DEBUG] Agent data:', data);
          const postCallWebhookId = data.webhooks?.post_call_webhook_id;
          const sendAudio = data.webhooks?.send_audio || false;
          
          setSendAudio(sendAudio);
          
          if (postCallWebhookId) {
            // Fetch webhook details
            return fetch('https://api.elevenlabs.io/v1/workspace/webhooks', {
              headers: {
                'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
                'Content-Type': 'application/json',
              },
            }).then(webhookRes => webhookRes.json()).then(webhookData => {
              console.log('[DEBUG] Webhooks data:', webhookData);
              const webhook = webhookData.webhooks?.find((w: any) => w.id === postCallWebhookId);
              console.log('[DEBUG] Found webhook:', webhook);
              if (webhook) {
                setCurrentWebhook(webhook);
              }
            });
          }
        })
        .catch(console.error)
        .finally(() => setWebhookLoading(false));
    }
  }, [agentId]);

  const handleWebhookSelect = async (webhookId: string) => {
    setWebhookLoading(true);
    try {
      const payload = {
        webhooks: {
          post_call_webhook_id: webhookId,
          send_audio: sendAudio
        }
      };
      console.log('[DEBUG] PATCH payload for webhook assignment:', payload);
      
      const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const responseData = await res.json();
      console.log('[DEBUG] PATCH response for webhook assignment:', responseData);
      
      if (res.ok) {
        // Fetch webhook details to display
        const webhookRes = await fetch('https://api.elevenlabs.io/v1/workspace/webhooks', {
          headers: {
            'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
            'Content-Type': 'application/json',
          },
        });
        const webhookData = await webhookRes.json();
        const selectedWebhook = webhookData.webhooks.find((w: any) => w.id === webhookId);
        setCurrentWebhook(selectedWebhook || null);
      } else {
        console.error('[DEBUG] Failed to assign webhook:', responseData);
      }
    } catch (error) {
      console.error('Failed to assign webhook:', error);
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleRemoveWebhook = async () => {
    setWebhookLoading(true);
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhooks: {
            post_call_webhook_id: null,
            send_audio: sendAudio
          }
        }),
      });
      if (res.ok) {
        setCurrentWebhook(null);
      }
    } catch (error) {
      console.error('Failed to remove webhook:', error);
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleSendAudioToggle = async (enabled: boolean) => {
    setSendAudio(enabled);
    try {
      await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhooks: {
            post_call_webhook_id: currentWebhook?.id || null,
            send_audio: enabled
          }
        }),
      });
    } catch (error) {
      console.error('Failed to update send audio setting:', error);
    }
  };

  // Load clients for the dropdown
  const loadClients = async () => {
    if (isLoadingClients) return;
    
    setIsLoadingClients(true);
    try {
      const response = await api.getClients();
      const data = await response.json();
      
      if (data.success) {
        const mappedClients = data.data.map((client: any) => ({
          id: client.id,
          name: client.companyName,
          contactPerson: client.contactPersonName,
          email: client.companyEmail,
          phone: client.phoneNumber,
          clientId: String(client.id),
          status: client.status || "Active",
          plan: client.planName || "",
          totalCallsMade: client.totalCallsMade || 0,
          monthlyCallLimit: client.monthlyCallLimit || 0,
          joinedDate: client.created_at || new Date().toISOString(),
          avatarUrl: "",
        }));
        setClients(mappedClients);
      } else {
        toast({ title: 'Error', description: 'Failed to fetch clients', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      toast({ title: 'Error', description: 'Failed to load clients', variant: 'destructive' });
    } finally {
      setIsLoadingClients(false);
    }
  };

  // Handle agent rename
  const handleRename = async () => {
    if (!newAgentName.trim()) {
      toast({ title: 'Error', description: 'Please enter a valid agent name', variant: 'destructive' });
      return;
    }

    try {
      // Update in ElevenLabs
      const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAgentName.trim()
        }),
      });

      if (!elevenLabsResponse.ok) {
        throw new Error('Failed to update agent name in ElevenLabs');
      }

      // Update in local database
      const localResponse = await fetch(`/api/agents/${agentId}/details`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          local: {
            name: newAgentName.trim()
          }
        }),
      });

      if (!localResponse.ok) {
        throw new Error('Failed to update agent name in local database');
      }

      // Update local state
      setLocalAgent((prev: any) => ({ ...prev, name: newAgentName.trim() }));
      setIsRenaming(false);
      setNewAgentName("");

      toast({ title: 'Success', description: 'Agent name updated successfully' });
    } catch (error) {
      console.error('Error renaming agent:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to rename agent', 
        variant: 'destructive' 
      });
    }
  };

  // Handle copy agent ID
  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(agentId as string);
      setCopiedId(true);
      toast({ title: 'Success', description: 'Agent ID copied to clipboard' });
      setTimeout(() => setCopiedId(false), 2000);
    } catch (error) {
      console.error('Error copying agent ID:', error);
      toast({ title: 'Error', description: 'Failed to copy agent ID', variant: 'destructive' });
    }
  };

  // Handle client change
  const handleClientChange = async () => {
    if (!selectedClientId) {
      toast({ title: 'Error', description: 'Please select a client', variant: 'destructive' });
      return;
    }

    setIsChangingClient(true);
    try {
      // Update in local database
      const localResponse = await fetch(`/api/agents/${agentId}/details`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          local: {
            client_id: parseInt(selectedClientId)
          }
        }),
      });

      if (!localResponse.ok) {
        throw new Error('Failed to update client assignment in local database');
      }

      // Update in ElevenLabs
      const elevenLabsResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: parseInt(selectedClientId)
        }),
      });

      if (!elevenLabsResponse.ok) {
        console.warn('Failed to update client assignment in ElevenLabs, but local update succeeded');
      }

      // Update local state
      setLocalAgent((prev: any) => ({ ...prev, client_id: parseInt(selectedClientId) }));

      const selectedClient = clients.find(client => client.id === selectedClientId);
      toast({ 
        title: 'Success', 
        description: `Agent assigned to ${selectedClient?.name || 'selected client'} successfully` 
      });
    } catch (error) {
      console.error('Error changing client assignment:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to change client assignment', 
        variant: 'destructive' 
      });
    } finally {
      setIsChangingClient(false);
    }
  };

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Set selected client when localAgent data is loaded
  useEffect(() => {
    if (localAgent.client_id && clients.length > 0) {
      setSelectedClientId(String(localAgent.client_id));
    }
  }, [localAgent.client_id, clients]);

  // Workspace secrets handler functions
  const handleAddSecret = async () => {
    if (!secretName.trim() || !secretValue.trim()) {
      toast({ title: 'Error', description: 'Please enter both name and value for the secret', variant: 'destructive' });
      return;
    }

    setIsAddingSecret(true);
    try {
      console.log('Adding secret:', { name: secretName.trim(), value: secretValue.trim() });
      
      // Add secret to ElevenLabs
      const response = await fetch(`/api/elevenlabs/secrets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: secretName.trim(),
          value: secretValue.trim()
        }),
      });

      console.log('Add secret response status:', response.status);
      console.log('Add secret response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('Secret added successfully:', result);
        
        // Refresh secrets list from ElevenLabs
        await fetchWorkspaceSecrets();
        
        // Reset form
        setSecretName("");
        setSecretValue("");
        setShowAddSecretModal(false);
        
        toast({ title: 'Success', description: 'Secret added successfully' });
      } else {
        const errorText = await response.text();
        console.error('Failed to add secret:', response.status, errorText);
        let errorMessage = 'Unknown error';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.details || 'Unknown error';
        } catch (e) {
          errorMessage = errorText;
        }
        toast({ title: 'Error', description: `Failed to add secret to ElevenLabs: ${errorMessage}`, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error adding secret:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to add secret', variant: 'destructive' });
    } finally {
      setIsAddingSecret(false);
    }
  };

  const handleDeleteSecret = async (secretName: string) => {
    // Find the secret to check if it's in use
    const secret = workspaceSecrets.find(s => (s.id || s.name) === secretName);
    if (secret && isSecretInUse(secret)) {
      toast({ 
        title: 'Cannot Delete', 
        description: 'This secret is currently in use and cannot be deleted. Remove it from all tools, agents, or phone numbers first.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      // Delete secret from ElevenLabs
      const response = await fetch(`/api/elevenlabs/secrets/${encodeURIComponent(secretName)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete secret from ElevenLabs');
      }

      // Refresh secrets list from ElevenLabs
      await fetchWorkspaceSecrets();
      
      toast({ title: 'Success', description: 'Secret deleted successfully' });
    } catch (error) {
      console.error('Error deleting secret:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete secret', variant: 'destructive' });
    }
  };

  // Check if a secret is in use
  const isSecretInUse = (secret: any) => {
    if (!secret.used_by) return false;
    
    const { tools, agents, others, phone_numbers } = secret.used_by;
    return (
      (tools && tools.length > 0) ||
      (agents && agents.length > 0) ||
      (others && others.length > 0) ||
      (phone_numbers && phone_numbers.length > 0)
    );
  };

  const fetchWorkspaceSecrets = async () => {
    try {
      console.log('Fetching workspace secrets...');
      const response = await fetch(`/api/elevenlabs/secrets`);
      console.log('Secrets response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('ElevenLabs secrets API response:', data);
        
        // Handle different possible response structures
        let secrets = [];
        if (Array.isArray(data)) {
          secrets = data;
        } else if (data && Array.isArray(data.secrets)) {
          secrets = data.secrets;
        } else if (data && Array.isArray(data.data)) {
          secrets = data.data;
        } else if (data && typeof data === 'object') {
          // If it's an object with secret properties, convert to array
          secrets = Object.keys(data).map(key => ({
            id: key,
            name: key,
            ...data[key]
          }));
        }
        
        // Ensure each secret has the correct structure
        secrets = secrets.map((secret: any) => ({
          id: secret.secret_id || secret.id,
          name: secret.name,
          type: secret.type,
          used_by: secret.used_by
        }));
        
        console.log('Processed secrets:', secrets);
        setWorkspaceSecrets(secrets);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch secrets:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('Error fetching workspace secrets:', error);
    }
  };

  // Fetch workspace secrets on component mount and after agent data is loaded
  useEffect(() => {
    fetchWorkspaceSecrets();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Add Secret Modal */}
      {showAddSecretModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Add secret</h2>
              </div>
              <button
                onClick={() => setShowAddSecretModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Securely store a value that can be used by the tools. Once added the value cannot be retrieved.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={secretName}
                    onChange={(e) => setSecretName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter secret name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <textarea
                    value={secretValue}
                    onChange={(e) => setSecretValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    placeholder="Enter secret value"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowAddSecretModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSecret}
                disabled={!secretName.trim() || !secretValue.trim() || isAddingSecret}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isAddingSecret ? 'Adding...' : 'Add secret'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">Agents &gt; {localAgent.name || 'Loading...'}</div>
          <div className="flex items-center gap-2 mb-1">
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                  className="text-2xl font-bold border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new name"
                  autoFocus
                />
                <button
                  onClick={handleRename}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsRenaming(false);
                    setNewAgentName("");
                  }}
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h1 className="text-2xl font-bold">{localAgent.name || 'Loading...'}</h1>
            )}
            <span className="bg-gray-200 text-xs px-2 py-1 rounded">Public</span>
            {!isRenaming && (
              <button
                onClick={() => {
                  setIsRenaming(true);
                  setNewAgentName(localAgent.name || '');
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Rename agent"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Agent ID:</span>
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{agentId as string}</span>
              <button
                onClick={handleCopyId}
                className={`text-gray-500 hover:text-gray-700 transition-colors ${copiedId ? 'text-green-500' : ''}`}
                title="Copy agent ID"
              >
                {copiedId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Client:</span>
              <div className="relative">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  disabled={isLoadingClients || isChangingClient}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.status})
                    </option>
                  ))}
                </select>
                {isLoadingClients && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  </div>
                )}
              </div>
              {selectedClientId && (
                <button
                  onClick={handleClientChange}
                  disabled={isChangingClient}
                  className="bg-black text-white px-3 py-1 rounded text-sm hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isChangingClient ? 'Updating...' : 'Update Client'}
                </button>
              )}
            </div>
          </div>
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
                {/* Agent Language (single select with flag) */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Agent Language</div>
                  <div className="text-gray-500 text-sm mb-2">Choose the default language the agent will communicate in.</div>
                  <Select
                    value={languageOptions.find(opt => opt.value === agentSettings.language)}
                    onChange={opt => setAgentSettings(prev => ({ ...prev, language: opt?.value || 'en' }))}
                    options={languageOptions}
                    isSearchable
                    placeholder="Select language"
                    classNamePrefix="react-select"
                  />
                </div>
                {/* Additional Languages (multi select with flags) */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Additional Languages</div>
                  <div className="text-gray-500 text-sm mb-2">Specify additional languages which callers can choose from.</div>
                  <Select
                    value={languageOptions.filter(opt => agentSettings.additional_languages.includes(opt.value))}
                    onChange={opts => setAgentSettings(prev => ({ ...prev, additional_languages: (opts || []).map((o: any) => o.value) }))}
                    options={languageOptions}
                    isMulti
                    isSearchable
                    placeholder="Add additional languages"
                    classNamePrefix="react-select"
                  />
                </div>
                {/* First Message */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">First message</div>
                  <div className="text-gray-500 text-sm mb-2">The first message the agent will say. If empty, the agent will wait for the user to start the conversation.</div>
                  <VariableTextarea
                    value={firstMessage}
                    onChange={setFirstMessage}
                    placeholder="e.g. Hello! How can I help you today?"
                  />
                </div>
                {/* System Prompt */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">System prompt</div>
                  <div className="text-gray-500 text-sm mb-2">The system prompt is used to determine the persona of the agent and the context of the conversation. <span className="underline cursor-pointer">Learn more</span></div>
                  <VariableTextarea
                    value={systemPrompt}
                    onChange={setSystemPrompt}
                    placeholder="Describe the desired agent (e.g., a customer support agent for ElevenLabs)"
                    dropdownButtonLabel={"+ Add Variable"}
                    showTimezoneButton={true}
                  />
                </div>
                {/* Dynamic Variables */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Dynamic Variables</div>
                  <div className="text-gray-500 text-sm mb-2">Variables like <span className="bg-gray-100 px-1 rounded">&#123;&#123;user_name&#125;&#125;</span> in your prompts and first message will be replaced with actual values when the conversation starts. <span className="underline cursor-pointer">Learn more</span></div>
                  {/* Removed input and button for adding variables */}
                </div>
                {/* LLM */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">LLM</div>
                  <div className="text-gray-500 text-sm mb-2">Select which provider and model to use for the LLM.</div>
                  <select
                    value={agentSettings.llm}
                    onChange={e => setAgentSettings(prev => ({ ...prev, llm: e.target.value }))}
                    className="border rounded px-3 py-2 w-64"
                  >
                    {LLM_MODELS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  {agentSettings.llm === "custom-llm" && (
                    <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-4 mt-4">
                      <div>
                        <label className="font-semibold">Server URL</label>
                        <input
                          type="text"
                          className="border rounded px-3 py-2 w-full mt-1"
                          placeholder="https://api.openai.com/v1"
                          value={agentSettings.custom_llm_url || ""}
                          onChange={e => setAgentSettings(prev => ({ ...prev, custom_llm_url: e.target.value }))}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          The server is expected to match the OpenAI <a href="https://platform.openai.com/docs/api-reference/chat/create" target="_blank" rel="noopener noreferrer" className="underline">create chat completions API</a>.<br />
                          We will send the requests to <b>&lt;Server URL&gt;/chat/completions</b> endpoint on the server.
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold">Model ID</label>
                        <input
                          type="text"
                          className="border rounded px-3 py-2 w-full mt-1"
                          value={agentSettings.custom_llm_model_id || ""}
                          onChange={e => setAgentSettings(prev => ({ ...prev, custom_llm_model_id: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="font-semibold">API Key</label>
                        <input
                          type="text"
                          className="border rounded px-3 py-2 w-full mt-1"
                          value={agentSettings.custom_llm_api_key || ""}
                          onChange={e => setAgentSettings(prev => ({ ...prev, custom_llm_api_key: e.target.value }))}
                          placeholder="None"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          We strongly suggest using an API key to authenticate with your LLM server.
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold">Request Headers</label>
                        <button
                          className="bg-gray-200 px-3 py-2 rounded mt-2"
                          onClick={() =>
                            setAgentSettings(prev => ({
                              ...prev,
                              custom_llm_headers: [
                                ...(prev.custom_llm_headers || []),
                                { type: "Secret", name: "", secret: "" }
                              ]
                            }))
                          }
                        >
                          Add header
                        </button>
                        <div className="text-xs text-gray-500 mt-1">
                          Define headers that will be sent with requests to your LLM.
                        </div>
                        {(agentSettings.custom_llm_headers || []).map((header, idx) => (
                          <div key={idx} className="border rounded p-3 mt-3 flex flex-col gap-2">
                            <div className="flex gap-2">
                              <select
                                value={header.type}
                                onChange={e => {
                                  const newHeaders = [...agentSettings.custom_llm_headers];
                                  newHeaders[idx].type = e.target.value;
                                  setAgentSettings(prev => ({ ...prev, custom_llm_headers: newHeaders }));
                                }}
                                className="border rounded px-2 py-1"
                              >
                                <option value="Text">Value</option>
                                <option value="Secret">Secret</option>
                                <option value="Dynamic Variable">Dynamic Variable</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Name"
                                value={header.name}
                                onChange={e => {
                                  const newHeaders = [...agentSettings.custom_llm_headers];
                                  newHeaders[idx].name = e.target.value;
                                  setAgentSettings(prev => ({ ...prev, custom_llm_headers: newHeaders }));
                                }}
                                className="border rounded px-2 py-1 flex-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs">
                                {header.type === 'Text' ? 'Value' : header.type === 'Secret' ? 'Secret' : header.type === 'Dynamic Variable' ? 'Dynamic Variable' : 'Value'}
                              </label>
                              <input
                                type="text"
                                value={header.secret}
                                onChange={e => {
                                  const newHeaders = [...agentSettings.custom_llm_headers];
                                  newHeaders[idx].secret = e.target.value;
                                  setAgentSettings(prev => ({ ...prev, custom_llm_headers: newHeaders }));
                                }}
                                className="border rounded px-2 py-1 w-full"
                              />
                            </div>
                            <button
                              className="bg-gray-200 px-3 py-1 rounded text-red-600 w-fit"
                              onClick={() => {
                                const newHeaders = agentSettings.custom_llm_headers.filter((_, i) => i !== idx);
                                setAgentSettings(prev => ({ ...prev, custom_llm_headers: newHeaders }));
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Temperature */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Temperature</div>
                  <div className="text-gray-500 text-sm mb-2">Temperature is a parameter that controls the creativity or randomness of the responses generated by the LLM.</div>
                  <div className="flex gap-2 mb-2">
                    {tempPresets.map(p => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setAgentSettings(prev => ({ ...prev, temperature: Number(p.value) }))}
                        className={`px-3 py-1 rounded ${Number(agentSettings.temperature) === Number(p.value) ? 'bg-black text-white' : 'bg-gray-200'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={Number(agentSettings.temperature)}
                    onChange={e => setAgentSettings(prev => ({ ...prev, temperature: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">Current: {agentSettings.temperature}</div>
                </div>
                {/* Token Limit */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Limit token usage</div>
                  <div className="text-gray-500 text-sm mb-2">Configure the maximum number of tokens that the LLM can predict. A limit will be applied if the value is greater than 0.</div>
                  <input type="number" min={-1} value={tokenLimit} onChange={e => setTokenLimit(Number(e.target.value))} className="border rounded px-3 py-2 w-32" />
                </div>
                {/* Agent Knowledge Base */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Agent knowledge base</div>
                  <div className="text-gray-500 text-sm mb-2">Provide the LLM with domain-specific information to help it answer questions more accurately.</div>
                  <button
                    type="button"
                    className="bg-gray-200 px-3 py-2 rounded w-fit"
                    onClick={() => setShowDocPicker(true)}
                  >
                    Add document
                  </button>
                  {/* Show selected docs */}
                  {selectedDocs.length > 0 && (
                    <div className="mt-2">
                      {selectedDocs.map(doc => (
                        <div key={doc.id} className="flex items-center gap-2 border-b py-2">
                          <span>{doc.icon || (doc.type === 'web' ? '🌐' : doc.type === 'text' ? '📝' : '📄')}</span>
                          <span className="font-medium">{doc.name || doc.title || doc.id}</span>
                          <span className="text-xs text-gray-500">{doc.id}</span>
                          <button
                            type="button"
                            className="ml-auto text-red-500 hover:text-red-700 text-sm"
                            onClick={() => {
                              console.log(`[Agent Details] Removing knowledge base item from agent ${agentId}:`, {
                                agentId,
                                docId: doc.id,
                                docName: doc.name,
                                timestamp: new Date().toISOString()
                              });
                              setSelectedDocs(prev => prev.filter(d => d.id !== doc.id));
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Document picker modal/dropdown */}
                  {showDocPicker && (
                    <div ref={docPickerRef} className="absolute z-50 bg-white border rounded-xl shadow-lg p-3 mt-2 w-80" style={{ minWidth: 320 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          className="border rounded px-3 py-2 w-full text-sm"
                          placeholder="Search documents..."
                          // Add search logic if needed
                        />
                        {/* +Type dropdown */}
                        <div className="relative">
                          <button
                            className="border rounded px-2 py-1 text-xs font-medium"
                            onClick={e => {
                              e.stopPropagation();
                              setDocTypeDropdownOpen(v => !v);
                            }}
                          >
                            + Type
                          </button>
                          {docTypeDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-32 bg-white border rounded shadow-lg z-10">
                              {['file', 'url', 'text'].map(type => (
                                <label key={type} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={docTypeFilter[type as keyof typeof docTypeFilter]}
                                    onChange={e => setDocTypeFilter(f => ({ ...f, [type]: e.target.checked }))}
                                  />
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {Array.isArray(availableDocs) && availableDocs
                          .filter(doc => {
                            const types = Object.entries(docTypeFilter).filter(([k, v]) => v).map(([k]) => k);
                            return types.length === 0 || types.includes(doc.type);
                          })
                          .map(doc => (
                            <div
                              key={doc.id}
                              className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 cursor-pointer rounded"
                              onClick={() => {
                                setSelectedDocs(prev => [...prev, doc]);
                                setShowDocPicker(false);
                              }}
                            >
                              <span className="text-lg">{doc.icon || (doc.type === 'web' ? '🌐' : doc.type === 'text' ? '📝' : '📄')}</span>
                              <span className="font-medium">{doc.name || doc.title || doc.id}</span>
                              <span className="text-xs text-gray-500 ml-auto">{doc.id}</span>
                            </div>
                          ))}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button className="border rounded px-2 py-1 flex-1 text-xs" onClick={() => { setOpenDialog('url'); setShowDocPicker(false); }}>Add URL</button>
                        <button className="border rounded px-2 py-1 flex-1 text-xs" onClick={() => { setOpenDialog('files'); setShowDocPicker(false); }}>Add Files</button>
                        <button className="border rounded px-2 py-1 flex-1 text-xs" onClick={() => { setOpenDialog('text'); setShowDocPicker(false); }}>Create Text</button>
                      </div>
                    </div>
                  )}
                  {/* Add document dialogs (reuse or stub) */}
                  {openDialog === 'url' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                        <div className="font-semibold text-lg mb-2">Add URL</div>
                        <input className="border rounded px-3 py-2 w-full mb-3" placeholder="https://example.com" value={addUrlInput} onChange={e => setAddUrlInput(e.target.value)} />
                        <div className="flex justify-end gap-2">
                          <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setOpenDialog(null)} disabled={addDocLoading}>Cancel</button>
                          <button className="px-4 py-2 rounded bg-black text-white" onClick={handleAddUrl} disabled={addDocLoading || !addUrlInput}>{addDocLoading ? 'Adding...' : 'Add'}</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {openDialog === 'files' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                        <div className="font-semibold text-lg mb-2">Add Files</div>
                        <input type="file" className="mb-3" onChange={e => setAddFile(e.target.files?.[0] || null)} />
                        <div className="flex justify-end gap-2">
                          <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setOpenDialog(null)} disabled={addDocLoading}>Cancel</button>
                          <button className="px-4 py-2 rounded bg-black text-white" onClick={handleAddFile} disabled={addDocLoading || !addFile}>{addDocLoading ? 'Adding...' : 'Add'}</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {openDialog === 'text' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                        <div className="font-semibold text-lg mb-2">Create Text</div>
                        <input className="border rounded px-3 py-2 w-full mb-3" placeholder="Text Name" value={addTextName} onChange={e => setAddTextName(e.target.value)} />
                        <textarea className="border rounded px-3 py-2 w-full mb-3 min-h-[100px]" placeholder="Enter your text content here" value={addTextContent} onChange={e => setAddTextContent(e.target.value)} />
                        <div className="flex justify-end gap-2">
                          <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setOpenDialog(null)} disabled={addDocLoading}>Cancel</button>
                          <button className="px-4 py-2 rounded bg-black text-white" onClick={handleAddText} disabled={addDocLoading || !addTextName || !addTextContent}>{addDocLoading ? 'Creating...' : 'Create'}</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Use RAG */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Use RAG</div>
                  <div className="text-gray-500 text-sm mb-2">Retrieval-Augmented Generation (RAG) increases the agent's maximum Knowledge Base size. The agent will have access to relevant pieces of attached Knowledge Base during answer generation.</div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={useRag} onChange={e => setUseRag(e.target.checked)} /> Enable RAG
                  </label>
                </div>
                {/* Tools (dynamic from API) */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Tools</div>
                  <div className="text-gray-500 text-sm mb-2">Let the agent perform specific actions.</div>
                  {toolsLoading ? (
                    <div className="text-gray-500">Loading tools...</div>
                  ) : toolsError ? (
                    <div className="text-red-500">{toolsError}</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {/* Built-in tools */}
                      {BUILT_IN_TOOLS.map(tool => (
                        <div key={tool.name} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div>
                            <div className="font-medium">{tool.label}</div>
                            <div className="text-xs text-gray-500">{tool.description}</div>
                          </div>
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={agentSettings.tools.includes(tool.name)}
                              onChange={e => {
                                setAgentSettings(prev => ({
                                  ...prev,
                                  tools: e.target.checked
                                    ? [...prev.tools, tool.name]
                                    : prev.tools.filter((t: string) => t !== tool.name)
                                }));
                              }}
                              className="sr-only peer"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${agentSettings.tools.includes(tool.name) ? 'bg-blue-600' : 'bg-gray-200'}`}
                              style={{ position: 'relative' }}>
                              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${agentSettings.tools.includes(tool.name) ? 'translate-x-5' : ''}`}></div>
                            </div>
                          </label>
                        </div>
                      ))}
                      {/* Custom tools from API (exclude built-in tool names) */}
                      {allTools.filter(tool => !BUILT_IN_TOOLS.some(b => b.name === tool.name)).map(tool => (
                        <div key={tool.id || tool.name} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div>
                            <div className="font-medium">{tool.name}</div>
                            <div className="text-xs text-gray-500">{tool.description}</div>
                          </div>
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={agentSettings.tools.includes(tool.name)}
                              onChange={e => {
                                setAgentSettings(prev => ({
                                  ...prev,
                                  tools: e.target.checked
                                    ? [...prev.tools, tool.name]
                                    : prev.tools.filter((t: string) => t !== tool.name)
                                }));
                              }}
                              className="sr-only peer"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${agentSettings.tools.includes(tool.name) ? 'bg-blue-600' : 'bg-gray-200'}`}
                              style={{ position: 'relative' }}>
                              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${agentSettings.tools.includes(tool.name) ? 'translate-x-5' : ''}`}></div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Custom MCP Servers */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2 relative">
                  <div className="font-semibold">Custom MCP Servers</div>
                  <div className="text-gray-500 text-sm mb-2">Provide the agent with Model Context Protocol servers to extend its capabilities.</div>
                  <div className="relative">
                    <button
                      className="bg-gray-200 px-3 py-2 rounded w-fit"
                      onClick={() => setShowMcpDialog(v => !v)}
                    >
                      Add Server
                    </button>
                    {showMcpDialog && (
                      <div className="absolute z-50 bg-white border rounded shadow-lg mt-2 right-0 min-w-[320px]" style={{ minWidth: 320 }}>
                        {(!mcpServers || mcpServers.length === 0) ? (
                          <>
                            <div className="text-center text-gray-500 py-4">No MCP Servers found</div>
                            <button
                              className="w-full border rounded px-3 py-2 mb-2 font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
                              onClick={() => { setShowMcpDrawer(true); setShowMcpDialog(false); }}
                            >
                              <span className="text-xl font-bold">+</span> New Custom MCP Server
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="max-h-60 overflow-y-auto divide-y">
                              {mcpServers.map((server: any, idx: number) => (
                                <div key={server.id || idx} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                                  <div className="font-medium">{server.name || 'MCP Server'}</div>
                                  <div className="text-xs text-gray-500">{server.description || server.url || ''}</div>
                                </div>
                              ))}
                            </div>
                            <button
                              className="w-full border rounded px-3 py-2 mb-2 font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
                              onClick={() => { setShowMcpDrawer(true); setShowMcpDialog(false); }}
                            >
                              <span className="text-xl font-bold">+</span> New Custom MCP Server
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {showMcpDrawer && (
                      <NewCustomMcpServerDrawer open={showMcpDrawer} onClose={() => setShowMcpDrawer(false)} />
                    )}
                  </div>
                </div>
                {/* Workspace Secrets */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg">Workspace Secrets</div>
                      <div className="text-xs text-gray-500">Create and manage authentication connections that can be used by workspace tools.</div>
                    </div>
                    <button
                      onClick={() => setShowAddSecretModal(true)}
                      className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 transition-colors"
                    >
                      Add Secret
                    </button>
                  </div>
                  
                  {workspaceSecrets.length > 0 ? (
                    <div className="space-y-2">
                      {workspaceSecrets.map((secret, index) => (
                        <div key={secret.id || secret.name || index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-gray-500" />
                            <div>
                              <span className="font-medium text-sm">{secret.name || secret.id}</span>
                              {secret.used_by && (
                                <div className="text-xs text-gray-500">
                                  {secret.used_by.phone_numbers && secret.used_by.phone_numbers.length > 0 && (
                                    <div>Used by {secret.used_by.phone_numbers.length} phone number{secret.used_by.phone_numbers.length === 1 ? '' : 's'}</div>
                                  )}
                                  {secret.used_by.tools && secret.used_by.tools.length > 0 && (
                                    <div>Used by {secret.used_by.tools.length} tool{secret.used_by.tools.length === 1 ? '' : 's'}</div>
                                  )}
                                  {secret.used_by.agents && secret.used_by.agents.length > 0 && (
                                    <div>Used by {secret.used_by.agents.length} agent{secret.used_by.agents.length === 1 ? '' : 's'}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                                              <button
                      onClick={() => handleDeleteSecret(secret.id || secret.name)}
                      className={`transition-colors ${
                        isSecretInUse(secret) 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-red-500 hover:text-red-700'
                      }`}
                      title={isSecretInUse(secret) ? "Cannot delete - secret is in use" : "Delete secret"}
                      disabled={isSecretInUse(secret)}
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Lock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No secrets added yet</p>
                      <p className="text-xs">Add secrets to securely store values that can be used by tools</p>
                    </div>
                  )}
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
            {voiceLoading ? (
              <div className="text-center text-gray-500">Loading voice settings...</div>
            ) : (
              <>
                {/* Voice tab fields: voice select, multi-voice, use flash, TTS output, pronunciation dictionaries, latency, stability, speed, similarity */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Voice</div>
                  <div className="text-gray-500 text-sm mb-2">Select the ElevenLabs voice you want to use for the agent.</div>
                  <Select
                    isSearchable
                    isClearable={false}
                    value={elevenVoices.find(v => v.voice_id === voiceConfig.voice) ? {
                      value: voiceConfig.voice,
                      label: elevenVoices.find(v => v.voice_id === voiceConfig.voice)?.name,
                      raw: elevenVoices.find(v => v.voice_id === voiceConfig.voice)
                    } : null}
                    onChange={(opt: any) => {
                      if (opt && typeof opt === 'object' && !Array.isArray(opt) && 'value' in opt && typeof opt.value === 'string') {
                        setVoiceConfig(prev => ({ ...prev, voice: opt.value }));
                      } else {
                        setVoiceConfig(prev => ({ ...prev, voice: '' }));
                      }
                    }}
                    options={elevenVoices.map(v => ({
                      value: v.voice_id,
                      label: v.name,
                      raw: v
                    }))}
                    formatOptionLabel={(option: any) => {
                      const v = option.raw;
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `hsl(${v.voice_id.charCodeAt(0) * 13 % 360},70%,85%)` }}>
                            <span className="text-base font-bold">{v.name?.[0] || '?'}</span>
                          </div>
                          <span>{v.name}</span>
                          {v.labels?.use_case && (
                            <span className="ml-2 text-xs text-gray-500 truncate max-w-[120px]">{v.labels.use_case}</span>
                          )}
                        </div>
                      );
                    }}
                    styles={{
                      option: (base, state) => ({ ...base, color: '#222', background: state.isSelected ? '#e0e7ff' : state.isFocused ? '#f3f4f6' : '#fff', fontWeight: state.isSelected ? 600 : 400 }),
                      singleValue: base => ({ ...base, color: '#222' }),
                      menu: base => ({ ...base, zIndex: 9999 }),
                    }}
                    classNamePrefix="voice-select"
                  />
                </div>
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Multi-voice support <span className="text-xs bg-gray-100 px-2 py-1 rounded ml-2">New</span></div>
                  <div className="text-gray-500 text-sm mb-2">Specify additional ElevenLabs voices that the agent can switch to on demand. Useful for multi-character/emotional agents or language tutoring.</div>
                  <Select
                    isMulti
                    isSearchable
                    value={multiVoices.map(id => {
                      const v = elevenVoices.find(vv => vv.voice_id === id);
                      return v ? {
                        value: v.voice_id,
                        label: v.name,
                        raw: v
                      } : null;
                    }).filter(Boolean)}
                    onChange={(opts: MultiValue<any>, _action: ActionMeta<any>) => {
                      const selected = (opts || []).map((opt: any) => opt.value as string);
                      setMultiVoices(selected);
                      setVoiceConfig(prev => ({ ...prev, multi_voice_ids: selected }));
                    }}
                    options={elevenVoices.map(v => ({
                      value: v.voice_id,
                      label: v.name,
                      raw: v
                    }))}
                    formatOptionLabel={(option: any) => {
                      const v = option.raw;
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `hsl(${v.voice_id.charCodeAt(0) * 13 % 360},70%,85%)` }}>
                            <span className="text-base font-bold">{v.name?.[0] || '?'}</span>
                          </div>
                          <span>{v.name}</span>
                          {v.labels?.use_case && (
                            <span className="ml-2 text-xs text-gray-500 truncate max-w-[120px]">{v.labels.use_case}</span>
                          )}
                        </div>
                      );
                    }}
                    styles={{
                      option: (base, state) => ({ ...base, color: '#222', background: state.isSelected ? '#e0e7ff' : state.isFocused ? '#f3f4f6' : '#fff', fontWeight: state.isSelected ? 600 : 400 }),
                      multiValue: base => ({ ...base, background: '#e0e7ff', color: '#222', borderRadius: 6, padding: '0 4px' }),
                      multiValueLabel: base => ({ ...base, color: '#222', fontWeight: 500 }),
                      menu: base => ({ ...base, zIndex: 9999 }),
                    }}
                    classNamePrefix="voice-select"
                  />
                </div>
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={voiceConfig.use_flash} onChange={e => setVoiceConfig(prev => ({ ...prev, use_flash: e.target.checked }))} /> Use Flash</label>
                  <div className="text-xs text-gray-500 mb-2">Flash is our new recommended model for low latency use cases. For more comparison between Turbo and Flash, <a href="https://help.elevenlabs.io/hc/en-us/articles/19156300388881-Turbo-vs-Flash" target="_blank" rel="noopener noreferrer" className="underline">refer here</a>. Consider using Turbo for better quality at higher latency. We also recommend using Turbo for non-latin languages.<br/>Your agent will use <b>Turbo v2</b>.</div>
                </div>
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">TTS output format</div>
                  <div className="text-gray-500 text-sm mb-2">Select the output format you want to use for ElevenLabs text to speech.</div>
                  <select
                    value={voiceConfig.tts_output_format}
                    onChange={e => setVoiceConfig(prev => ({ ...prev, tts_output_format: e.target.value }))}
                    className="border rounded px-3 py-2 w-64"
                  >
                    <option value="pcm_8000">PCM 8000 Hz</option>
                    <option value="pcm_16000">PCM 16000 Hz</option>
                    <option value="pcm_22050">PCM 22050 Hz</option>
                    <option value="pcm_24000">PCM 24000 Hz</option>
                    <option value="pcm_44100">PCM 44100 Hz</option>
                    <option value="pcm_48000">PCM 48000 Hz</option>
                    <option value="ulaw_8000">µ-law 8000 Hz</option>
                  </select>
                </div>
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Pronunciation Dictionaries</div>
                  <div className="text-gray-500 text-sm mb-2">Lexicon dictionary files will apply pronunciation replacements to agent responses. Currently, the phoneme function of the pronunciation dictionaries only works with the Turbo v2 model, while the alias function works with all models.</div>
                  <input
                    type="file"
                    accept=".pls,.txt,.xml"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleAddDictionaryFile}
                  />
                  <button
                    className="bg-gray-200 px-3 py-2 rounded w-fit"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    Add dictionary
                  </button>
                </div>
                {/* Sliders for latency, stability, speed, similarity */}
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Optimize streaming latency <span className="ml-1">🕒</span></div>
                  <div className="text-gray-500 text-sm mb-2">Configure latency optimizations for the speech generation. Latency can be optimized at the cost of quality.</div>
                    <input
                      type="range"
                      min={0}
                      max={4}
                      step={1}
                    value={String(typeof voiceConfig["latency"] === 'number' ? voiceConfig["latency"] : 0)}
                    onChange={e => setVoiceConfig(prev => ({ ...prev, ["latency"]: Number(e.target.value) }))}
                      className="w-full"
                    />
                  <div className="text-xs text-gray-500">Current: {voiceConfig["latency"]}</div>
                </div>
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Stability</div>
                  <div className="text-gray-500 text-sm mb-2">Higher values will make speech more consistent, but it can also make it sound monotone. Lower values will make speech sound more expressive, but may lead to instabilities.</div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={String(typeof voiceConfig["stability"] === 'number' ? voiceConfig["stability"] : 0)}
                    onChange={e => setVoiceConfig(prev => ({ ...prev, ["stability"]: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">Current: {voiceConfig["stability"]}</div>
                </div>
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Speed</div>
                  <div className="text-gray-500 text-sm mb-2">Controls the speed of the generated speech. Values below 1.0 will slow down the speech, while values above 1.0 will speed it up. Extreme values may affect the quality of the generated speech.</div>
                  <input
                    type="range"
                    min={0}
                    max={1.2}
                    step={0.01}
                    value={String(typeof voiceConfig["speed"] === 'number' ? voiceConfig["speed"] : 0)}
                    onChange={e => setVoiceConfig(prev => ({ ...prev, ["speed"]: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">Current: {voiceConfig["speed"]}</div>
                </div>
                <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                  <div className="font-semibold">Similarity</div>
                  <div className="text-gray-500 text-sm mb-2">Higher values will boost the overall clarity and consistency of the voice. Very high values may lead to artifacts. Adjusting this value to find the right balance is recommended.</div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={String(typeof voiceConfig["similarity"] === 'number' ? voiceConfig["similarity"] : 0)}
                    onChange={e => setVoiceConfig(prev => ({ ...prev, ["similarity"]: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500">Current: {voiceConfig["similarity"]}</div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <button type="button" onClick={handleSaveVoice} disabled={voiceSaveLoading} className="bg-black text-white px-6 py-2 rounded-lg font-medium">
                    {voiceSaveLoading ? "Saving..." : "Save Voice Settings"}
                  </button>
                  {voiceSaveSuccess && <span className="text-green-600 text-sm">Voice settings saved!</span>}
                  {voiceSaveError && <span className="text-red-600 text-sm">{voiceSaveError}</span>}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "Widget" && (
          <div className="space-y-6">
            {/* Embed code */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Embed code</div>
              <div className="text-gray-500 text-sm mb-2">Add the following snippet to the pages where you want the conversation widget to be.</div>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs flex-1 overflow-x-auto">
                  {`<elevenlabs-convai agent-id="${elevenLabsAgent?.agent_id || localAgent?.agent_id || 'loading...'}"></elevenlabs-convai><script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>`}
                </code>
                <button 
                  className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                  onClick={() => {
                    const codeToCopy = `<elevenlabs-convai agent-id="${elevenLabsAgent?.agent_id || localAgent?.agent_id || ''}"></elevenlabs-convai><script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>`;
                    navigator.clipboard.writeText(codeToCopy);
                    toast({
                      title: "Copied!",
                      description: "Embed code copied to clipboard.",
                    });
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
            
            {/* Feedback collection */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Feedback collection</div>
              <div className="text-gray-500 text-sm mb-2">Callers will be able to provide feedback continuously during the conversation and after it ends. Information about which agent response caused the feedback will be collected.</div>
              <select
                value={widgetConfig.feedback_collection}
                onChange={e => {
                  setWidgetConfig(prev => ({ ...prev, feedback_collection: e.target.value }));
                  setWidgetSettings(prev => ({ ...prev, feedback_mode: e.target.value }));
                }}
                className="border rounded px-3 py-2 w-64"
              >
                <option value="none">None</option>
                <option value="during">During conversation</option>
                <option value="end">End of conversation</option>
              </select>
            </div>
            
            {/* Save button for Widget tab */}
            <div className="flex items-center gap-4 mt-6">
              <button
                type="button"
                onClick={async () => {
                  setSaveLoading(true);
                  setSaveSuccess(false);
                  setSaveError("");
                  try {
                    // Generate embed code
                    const embedCode = `<elevenlabs-convai agent-id="${elevenLabsAgent?.agent_id || localAgent?.agent_id || ''}"></elevenlabs-convai><script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>`;
                    
                    // Save to database first
                    const dbRes = await fetch(`/api/agents/${agentId}/widget-settings`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        feedback_mode: widgetConfig.feedback_collection,
                        embed_code: embedCode
                      }),
                    });
                    
                    if (!dbRes.ok) {
                      throw new Error('Failed to save to database');
                    }
                    
                    // Save to ElevenLabs
                    const elevenLabsPayload = {
                      platform_settings: {
                        widget: {
                          feedback_mode: widgetConfig.feedback_collection,
                        }
                      }
                    };
                    
                    const elevenLabsRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
                      method: 'PATCH',
                      headers: {
                        'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(elevenLabsPayload),
                    });
                    
                    if (elevenLabsRes.ok) {
                      setSaveSuccess(true);
                      toast({
                        title: "Saved!",
                        description: "Widget settings updated in database and ElevenLabs.",
                      });
                      // Refresh widget settings from database
                      await fetchWidgetSettings();
                    } else {
                      const err = await elevenLabsRes.json();
                      setSaveError(err?.error || 'Failed to update ElevenLabs settings');
                    }
                  } catch (error) {
                    setSaveError('Network error. Please try again.');
                  } finally {
                    setSaveLoading(false);
                  }
                }}
                disabled={saveLoading}
                className="bg-black text-white px-6 py-2 rounded-lg font-medium"
              >
                {saveLoading ? "Saving..." : "Save"}
              </button>
              {saveSuccess && <span className="text-green-600 text-sm">Saved!</span>}
              {saveError && <span className="text-red-600 text-sm">{saveError}</span>}
              </div>
            <div className="mt-2 text-gray-600 text-sm">
              If you want to make more changes to the widget,{' '}
              <a href="https://elevenlabs.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">go to ElevenLabs</a>.
            </div>
          </div>
        )}

        {activeTab === "Advanced" && (
          <div className="space-y-6">
            {/* Turn timeout */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Turn timeout</div>
              <div className="text-gray-500 text-sm mb-2">The maximum number of seconds since the user last spoke. If exceeded, the agent will respond and force a turn. A value of -1 means the agent will never timeout and always wait for a response from the user.</div>
              <input type="number" className="border rounded px-2 py-1 w-32" value={advancedConfig.turn_timeout} onChange={e => setAdvancedConfig(prev => ({ ...prev, turn_timeout: Number(e.target.value) }))} placeholder="7" />
            </div>
            {/* Silence end call timeout */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Silence end call timeout</div>
              <div className="text-gray-500 text-sm mb-2">The maximum number of seconds since the user last spoke. If exceeded, the call will terminate. A value of -1 means there is no fixed cutoff.</div>
              <input type="number" className="border rounded px-2 py-1 w-32" value={advancedConfig.silence_end_call_timeout} onChange={e => setAdvancedConfig(prev => ({ ...prev, silence_end_call_timeout: Number(e.target.value) }))} placeholder="20" />
            </div>
            {/* Max conversation duration */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Max conversation duration</div>
              <div className="text-gray-500 text-sm mb-2">The maximum number of seconds that a conversation can last.</div>
              <input type="number" className="border rounded px-2 py-1 w-32" value={advancedConfig.max_conversation_duration} onChange={e => setAdvancedConfig(prev => ({ ...prev, max_conversation_duration: Number(e.target.value) }))} placeholder="300" />
            </div>
            {/* Keywords */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Keywords</div>
              <div className="text-gray-500 text-sm mb-2">Define a comma-separated list of keywords that have a higher likelihood of being predicted correctly.</div>
              <input
                type="text"
                className="border rounded px-2 py-1 w-full"
                value={keywordsInput}
                onChange={e => setKeywordsInput(e.target.value)}
                onBlur={() => setAdvancedConfig(prev => ({
                  ...prev,
                  keywords: keywordsInput.split(",").map(k => k.trim()).filter(Boolean)
                }))}
                placeholder="keyword1, keyword2"
              />
            </div>
            {/* Text only toggle */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={advancedConfig.text_only} onChange={e => setAdvancedConfig(prev => ({ ...prev, text_only: e.target.checked }))} /> Text only
                <span className="text-gray-500 text-sm">If enabled audio will not be processed and only text will be used.</span>
              </label>
            </div>
            {/* User input audio format */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">User input audio format</div>
              <div className="text-gray-500 text-sm mb-2">Select the input format you want to use for automatic speech recognition.</div>
              <select
                value={advancedConfig.user_input_audio_format}
                onChange={e => setAdvancedConfig(prev => ({ ...prev, user_input_audio_format: e.target.value }))}
                className="border rounded px-3 py-2 w-64"
              >
                <option value="pcm_8000">PCM 8000 Hz</option>
                <option value="pcm_16000">PCM 16000 Hz</option>
                <option value="pcm_22050">PCM 22050 Hz</option>
                <option value="pcm_24000">PCM 24000 Hz</option>
                <option value="pcm_44100">PCM 44100 Hz</option>
                <option value="pcm_48000">PCM 48000 Hz</option>
                <option value="ulaw_8000">µ-law 8000 Hz</option>
              </select>
            </div>
            {/* Client Events */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Client Events</div>
              <div className="text-gray-500 text-sm mb-2">Select the events that should be sent to the client.</div>
              <Select
                isMulti
                options={CLIENT_EVENT_OPTIONS}
                value={CLIENT_EVENT_OPTIONS.filter(opt => advancedConfig.client_events.includes(opt.value))}
                onChange={(selected: any) =>
                  setAdvancedConfig(prev => ({
                    ...prev,
                    client_events: Array.isArray(selected) ? selected.map((opt: any) => opt.value) : [],
                  }))
                }
                classNamePrefix="react-select"
                placeholder="Select client events"
              />
            </div>
            {/* Privacy Settings */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Privacy Settings</div>
              <div className="text-gray-500 text-sm mb-2">This section allows you to configure the privacy settings for the agent.</div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={advancedConfig.privacy_settings.store_call_audio}
                  onChange={e => setAdvancedConfig(prev => ({
                    ...prev,
                    privacy_settings: {
                      ...prev.privacy_settings,
                      store_call_audio: e.target.checked,
                      zero_ppi_retention_mode: e.target.checked ? false : prev.privacy_settings.zero_ppi_retention_mode,
                    }
                  }))}
                />
                Store Call Audio
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={advancedConfig.privacy_settings.zero_ppi_retention_mode}
                  onChange={e => setAdvancedConfig(prev => ({
                    ...prev,
                    privacy_settings: {
                      ...prev.privacy_settings,
                      zero_ppi_retention_mode: e.target.checked,
                      store_call_audio: e.target.checked ? false : prev.privacy_settings.store_call_audio,
                    }
                  }))}
                />
                Zero-PPI Retention Mode <span className="text-xs text-gray-400">&#9432;</span>
              </label>
            </div>
            {/* Conversations Retention Period */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Conversations Retention Period</div>
              <div className="text-gray-500 text-sm mb-2">Set the number of days to keep conversations (-1 for unlimited).</div>
              <input type="number" className="border rounded px-2 py-1 w-32" value={advancedConfig.conversations_retention_period} onChange={e => setAdvancedConfig(prev => ({ ...prev, conversations_retention_period: Number(e.target.value) }))} placeholder="730" />
            </div>

            {/* Save button */}
            <div className="flex items-center gap-4 mt-4">
              <button type="button" onClick={handleSave} disabled={saveLoading} className="bg-black text-white px-6 py-2 rounded-lg font-medium">
                {saveLoading ? "Saving..." : "Save"}
              </button>
              {saveSuccess && <span className="text-green-600 text-sm">Saved!</span>}
              {saveError && <span className="text-red-600 text-sm">{saveError}</span>}
            </div>
          </div>
        )}
        {activeTab === "Security" && (
          <div className="space-y-6">
            {/* Enable authentication */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={securityConfig.enable_authentication} onChange={e => setSecurityConfig(prev => ({ ...prev, enable_authentication: e.target.checked }))} />
                <span className="font-semibold">Enable authentication</span>
                <span className="text-gray-500 text-sm">Require users to authenticate before connecting to the agent.</span>
              </label>
            </div>
            {/* Allowlist */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Allowlist</div>
              <div className="text-gray-500 text-sm mb-2">Specify the hosts that will be allowed to connect to this agent.</div>
              <div className="flex gap-2 mb-2">
                <input type="text" className="border rounded px-2 py-1 flex-1" placeholder="Add host..." value={securityConfig.allowlistInput || ''} onChange={e => setSecurityConfig(prev => ({ ...prev, allowlistInput: e.target.value }))} />
                <button className="bg-gray-200 px-3 py-2 rounded" onClick={() => {
                  if (securityConfig.allowlistInput && !securityConfig.allowlist.includes(securityConfig.allowlistInput)) {
                    setSecurityConfig(prev => ({ ...prev, allowlist: [...prev.allowlist, prev.allowlistInput], allowlistInput: '' }));
                  }
                }}>Add host</button>
              </div>
              <div className="flex flex-col gap-1">
                {securityConfig.allowlist.filter((host: any) => typeof host === 'string' && host).map((host, idx) => (
                  <div key={host} className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1">
                    <span className="flex-1">{host}</span>
                    <button className="text-red-500" onClick={() => setSecurityConfig(prev => ({ ...prev, allowlist: prev.allowlist.filter((h, i) => i !== idx) }))}>&#128465;</button>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500">No allowlist specified. Any host will be able to connect to this agent.</div>
            </div>
            {/* Enable overrides */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Enable overrides</div>
              <div className="text-gray-500 text-sm mb-2">Choose which parts of the config can be overridden by the client at the start of the conversation.</div>
              {[
                { key: 'agent.language', label: 'Agent language', path: ['agent', 'language'] },
                { key: 'agent.first_message', label: 'First message', path: ['agent', 'first_message'] },
                { key: 'agent.prompt.prompt', label: 'System prompt', path: ['agent', 'prompt', 'prompt'] },
                { key: 'tts.voice_id', label: 'Voice', path: ['tts', 'voice_id'] },
                { key: 'conversation.text_only', label: 'Text only', path: ['conversation', 'text_only'] },
              ].map(f => (
                <label key={f.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!getNestedValue(securityConfig.enable_overrides.conversation_config_override, f.path)}
                    onChange={e => setSecurityConfig(prev => ({
                      ...prev,
                      enable_overrides: {
                        ...prev.enable_overrides,
                        conversation_config_override: setNestedValue(
                          prev.enable_overrides.conversation_config_override,
                          f.path,
                          e.target.checked
                        ),
                      },
                    }))}
                  />
                  {f.label}
                </label>
              ))}
            </div>
            {/* Fetch initiation client data from webhook */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={securityConfig.fetch_initiation_client_data} onChange={e => setSecurityConfig(prev => ({ ...prev, fetch_initiation_client_data: e.target.checked }))} />
                <span className="font-semibold">Fetch initiation client data from webhook</span>
                <span className="text-gray-500 text-sm">If enabled, the conversation initiation client data will be fetched from the webhook defined in the settings when receiving Twilio or SIP trunk calls.</span>
              </label>
            </div>
            {/* Post-Call Webhook */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg">Post-Call Webhook</div>
                  <div className="text-xs text-gray-500">Override the post-call webhook configured in settings for this agent.</div>
                </div>
                <button 
                  className="bg-gray-200 px-3 py-2 rounded text-sm" 
                  onClick={() => setWebhookModalOpen(true)}
                  disabled={webhookLoading}
                >
                  Select Webhook
                </button>
              </div>
              
              {currentWebhook ? (
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                      ⚡
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{currentWebhook.name}</div>
                      <div className="text-gray-500 text-xs truncate">{currentWebhook.url}</div>
                      <div className="text-gray-500 text-xs">
                        Auth Method: {currentWebhook.auth_method || 'None'}
                      </div>
                    </div>
                    <button 
                      onClick={handleRemoveWebhook}
                      disabled={webhookLoading}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No webhook assigned</div>
              )}
            </div>

            {/* Send audio data - only show when webhook is assigned */}
            {currentWebhook && (
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Send audio data</div>
                    <div className="text-xs text-gray-500">When enabled, a secondary streaming webhook will be sent including the audio data for each conversation.</div>
              </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendAudio}
                      onChange={(e) => handleSendAudioToggle(e.target.checked)}
                      disabled={webhookLoading}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
            </div>
              </div>
            )}
            {/* Enable bursting */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={securityConfig.enable_bursting} onChange={e => setSecurityConfig(prev => ({ ...prev, enable_bursting: e.target.checked }))} />
                <span className="font-semibold">Enable bursting</span>
                <span className="text-gray-500 text-sm">If enabled, the agent can exceed the workspace subscription concurrency limit by up to 3 times, with excess calls charged at double the normal rate.</span>
              </label>
            </div>
            {/* Concurrent Calls Limit */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Concurrent Calls Limit</div>
              <div className="text-gray-500 text-sm mb-2">The maximum number of concurrent calls allowed. Matching the subscription concurrency limit.</div>
              <input type="number" className="border rounded px-2 py-1 w-32" value={securityConfig.concurrent_calls_limit} onChange={e => setSecurityConfig(prev => ({ ...prev, concurrent_calls_limit: Number(e.target.value) }))} placeholder="-1" />
            </div>
            {/* Daily Calls Limit */}
            <div className="bg-white rounded-lg p-5 shadow flex flex-col gap-2">
              <div className="font-semibold">Daily Calls Limit</div>
              <div className="text-gray-500 text-sm mb-2">The maximum number of calls allowed per day.</div>
              <input type="number" className="border rounded px-2 py-1 w-32" value={securityConfig.daily_calls_limit} onChange={e => setSecurityConfig(prev => ({ ...prev, daily_calls_limit: Number(e.target.value) }))} placeholder="100000" />
            </div>
            {/* Save button and status */}
            <div className="flex items-center gap-4 mt-4">
              <button type="button" onClick={handleSaveSecurity} disabled={securitySaveLoading} className="bg-black text-white px-6 py-2 rounded-lg font-medium">
                {securitySaveLoading ? "Saving..." : "Save"}
              </button>
              {securitySaveSuccess && <span className="text-green-600 text-sm">Saved!</span>}
              {securitySaveError && <span className="text-red-600 text-sm">{securitySaveError}</span>}
              {securityLoading && <span className="text-gray-500 text-sm">Loading from ElevenLabs...</span>}
            </div>
          </div>
        )}
        {String(activeTab).trim().toLowerCase() === "analysis" && (
          <div>
            <div className="bg-white rounded-2xl p-5 shadow flex flex-col gap-2 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-lg">Evaluation criteria</div>
                  <div className="text-gray-500 text-sm">Define custom criteria to evaluate conversations against. You can find the evaluation results for each conversation in <a href="#" className="underline">the history tab</a>.</div>
                </div>
                <div className="flex items-center">
                  <button className="border border-black rounded-md px-3 py-1.5 text-sm font-medium hover:bg-gray-100" onClick={() => setShowCriteriaOverlay(true)}>Add criteria</button>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-2">
                {criteriaLoading ? <div>Loading...</div> : criteriaList.length === 0 ? (
                  <div className="text-gray-400 text-sm">No criteria yet.</div>
                ) : (
                  criteriaList.map((c, i) => (
                    <div key={c.name} className="flex items-center bg-gray-50 rounded-xl px-4 py-3 gap-4 border border-gray-100">
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg"><FaBrain className="text-2xl text-gray-400" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base">{c.name}</div>
                        <div className="text-gray-500 text-sm truncate">{c.prompt}</div>
                      </div>
                      <button className="ml-2 text-gray-400 hover:text-red-500" onClick={() => handleDeleteCriteria(c.name)}><FaTrash /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow flex flex-col gap-2 border border-gray-200 mt-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-lg">Data collection</div>
                  <div className="text-gray-500 text-sm">Define what data to extract from conversations for analytics or reporting.</div>
                </div>
                <div className="flex items-center">
                  <button className="border border-black rounded-md px-3 py-1.5 text-sm font-medium hover:bg-gray-100" onClick={() => setShowDataOverlay(true)}>Add item</button>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-2">
                {dataItemLoading ? <div>Loading...</div> : dataItemList.length === 0 ? (
                  <div className="text-gray-400 text-sm">No data items yet.</div>
                ) : (
                  dataItemList.map((d, i) => (
                    <div key={d.identifier} className="flex items-center bg-gray-50 rounded-xl px-4 py-3 gap-4 border border-gray-100">
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg"><FaBrain className="text-2xl text-gray-400" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base">{d.identifier} <span className="text-xs bg-gray-100 px-2 py-0.5 rounded ml-2">{d.type}</span></div>
                        <div className="text-gray-500 text-sm truncate">{d.description}</div>
                      </div>
                      <button className="ml-2 text-gray-400 hover:text-red-500" onClick={() => handleDeleteDataItem(d.identifier)}><FaTrash /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* Save button for Analysis tab */}
            <div className="flex items-center gap-4 mt-6">
              <button
                type="button"
                onClick={async () => {
                  setSaveLoading(true);
                  setSaveSuccess(false);
                  setSaveError("");
                  try {
                    // Build correct payload for ElevenLabs
                    const criteriaPayload = (criteriaList as any[]).map((c, idx) => ({
                      id: c.id || c.name || `criteria_${idx}`,
                      name: c.name,
                      prompt: c.prompt,
                      conversation_goal_prompt: c.conversation_goal_prompt || c.prompt
                    }));
                    // Only allow valid types for ElevenLabs: 'string', 'boolean', 'integer', 'number'
                    const allowedTypes = ['string', 'boolean', 'integer', 'number'];
                    const normalizeType = (t: string) => {
                      if (!t) return 'string';
                      const lower = t.toLowerCase();
                      return allowedTypes.includes(lower) ? lower : 'string';
                    };
                    const dataCollectionPayload = Object.fromEntries(
                      (dataItemList as any[]).map(d => [
                        d.identifier,
                        {
                          identifier: d.identifier,
                          type: normalizeType(d.type || d.data_type),
                          data_type: normalizeType(d.data_type || d.type),
                          description: d.description
                        }
                      ])
                    );
                    const payload = {
                      platform_settings: {
                        evaluation: {
                          criteria: criteriaPayload
                        },
                        data_collection: dataCollectionPayload
                      }
                    };
                    const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
                      method: "PATCH",
                      headers: {
                        'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(payload),
                    });
                    if (res.ok) {
                      setSaveSuccess(true);
                    } else {
                      const err = await res.json();
                      setSaveError(err?.error || JSON.stringify(err) || 'Failed to update analysis settings');
                    }
                  } catch {
                    setSaveError('Network error. Please try again.');
                  } finally {
                    setSaveLoading(false);
                  }
                }}
                disabled={saveLoading}
                className="bg-black text-white px-6 py-2 rounded-lg font-medium"
              >
                {saveLoading ? "Saving..." : "Save"}
              </button>
              {saveSuccess && <span className="text-green-600 text-sm">Saved!</span>}
              {saveError && <span className="text-red-600 text-sm">{saveError}</span>}
            </div>
            {/* Overlays for Add Criteria and Add Data Item */}
            {showCriteriaOverlay && (
              <div className="fixed inset-0 z-50 flex justify-end items-stretch bg-black bg-opacity-30 w-screen h-screen" onClick={e => { if (e.target === e.currentTarget) setShowCriteriaOverlay(false); }}>
                <div className="w-full h-full max-w-md bg-white shadow-xl p-8 flex flex-col absolute right-0 top-0" style={{ borderTopLeftRadius: 16, borderBottomLeftRadius: 16, height: '100vh' }} onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-lg font-semibold">Add criteria</div>
                    <button className="text-2xl text-gray-400 hover:text-gray-600" onClick={() => setShowCriteriaOverlay(false)}>&times;</button>
                  </div>
                  <div className="text-xs text-gray-500 mb-4">Goal prompt criteria<br/>Passes the conversation transcript together with a custom prompt to the LLM that verifies if a goal was met. The result will be one of three values: <b>success</b>, <b>failure</b>, or <b>unknown</b>, as well as a <i>rationale</i> describing why the given result was chosen.</div>
                  <label className="font-medium text-sm mb-1">Name</label>
                  <input className="border rounded px-3 py-2 w-full mb-4" placeholder="Enter the name to generate an ID." value={criteriaName} onChange={e => setCriteriaName(e.target.value)} />
                  <label className="font-medium text-sm mb-1">Prompt</label>
                  <textarea className="border rounded px-3 py-2 w-full mb-6 min-h-[80px]" placeholder="Enter prompt..." value={criteriaPrompt} onChange={e => setCriteriaPrompt(e.target.value)} />
                  <div className="flex justify-end gap-2 mt-auto">
                    <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowCriteriaOverlay(false)}>Cancel</button>
                    <button className="px-4 py-2 rounded bg-black text-white" onClick={handleAddCriteriaSubmit}>Add criteria</button>
                  </div>
                </div>
              </div>
            )}
            {showDataOverlay && (
              <div className="fixed inset-0 z-50 flex justify-end items-stretch bg-black bg-opacity-30 w-screen h-screen" onClick={e => { if (e.target === e.currentTarget) setShowDataOverlay(false); }}>
                <div className="w-full h-full max-w-md bg-white shadow-xl p-8 flex flex-col absolute right-0 top-0" style={{ borderTopLeftRadius: 16, borderBottomLeftRadius: 16, height: '100vh' }} onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-lg font-semibold">Add data collection item</div>
                    <button className="text-2xl text-gray-400 hover:text-gray-600" onClick={() => setShowDataOverlay(false)}>&times;</button>
                  </div>
                  <div className="flex flex-col gap-2 mb-4">
                    <label className="font-medium text-sm mb-1">Data type</label>
                    <select className="border rounded px-3 py-2 w-full" value={dataType} onChange={e => setDataType(e.target.value)}>
                      <option value="String">String</option>
                      <option value="Number">Number</option>
                      <option value="Boolean">Boolean</option>
                      <option value="Integer">Integer</option>
                    </select>
                  </div>
                  <label className="font-medium text-sm mb-1">Identifier</label>
                  <input className="border rounded px-3 py-2 w-full mb-4" placeholder="Enter identifier..." value={dataIdentifier} onChange={e => setDataIdentifier(e.target.value)} />
                  <label className="font-medium text-sm mb-1">Description</label>
                  <textarea className="border rounded px-3 py-2 w-full mb-6 min-h-[80px]" placeholder="Describe how to extract the data from the transcript..." value={dataDescription} onChange={e => setDataDescription(e.target.value)} />
                  <div className="text-xs text-gray-500 mb-4">This field will be passed to the LLM and should describe in detail how to extract the data from the transcript.</div>
                  <div className="flex justify-end gap-2 mt-auto">
                    <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowDataOverlay(false)}>Cancel</button>
                    <button className="px-4 py-2 rounded bg-black text-white" onClick={handleAddDataItemSubmit}>Add item</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* New • Chat tab can be scaffolded similarly */}
      </div>
      <WebhookModal open={webhookModalOpen} onOpenChange={setWebhookModalOpen} agentId={String(agentId ?? '')} onWebhookSelect={handleWebhookSelect} />
    </div>
  );
} 

// Helper function for tool descriptions
function getToolDescription(value: string) {
  switch (value) {
    case 'end_call': return 'Gives agent the ability to end the call with the user.';
    case 'language_detection': return 'Gives agent the ability to change the language during conversation.';
    case 'skip_turn': return 'Agent will skip its turn if user explicitly indicates they need a moment.';
    case 'transfer_to_agent': return 'Gives agent the ability to transfer the call to another AI agent.';
    case 'transfer_to_number': return 'Gives agent the ability to transfer the call to a human.';
    case 'play_keypad_tone': return 'Gives agent the ability to play keypad touch tones during a phone call.';
    default: return '';
  }
}

// Add helper functions for nested object manipulation:
function getNestedValue(obj: any, path: string[]): any {
  return path.reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj: any, path: string[], value: any): any {
  const newObj = { ...obj };
  let current = newObj;
  for (let i = 0; i < path.length - 1; i++) {
    current[path[i]] = { ...current[path[i]] };
    current = current[path[i]];
  }
  current[path[path.length - 1]] = value;
  return newObj;
}