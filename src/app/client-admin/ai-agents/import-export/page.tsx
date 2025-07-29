
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { UploadCloud, Download, FileJson, Loader2, CheckCircle, AlertCircle, Edit3, Database } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/apiConfig";

// Complete agent interface based on the actual data structure
interface CompleteAgent {
  id: string;
  name: string;
  description?: string;
  useCase?: string;
  tags?: string[];
  language?: string;
  status?: string;
  version?: string;
  source?: 'local' | 'elevenlabs';
  createdBy?: string;
  lastModified?: string;
  clientName?: string;
  client_id?: string;
  
  // Agent Settings
  agentSettings?: {
    language: string;
    additional_languages: string[];
    first_message: string;
    llm: string;
    temperature: number;
    token_limit: number;
    tool_ids: any[];
    built_in_tools: any;
    mcp_server_ids: any[];
    native_mcp_server_ids: any[];
    knowledge_base: any[];
    custom_llm: any;
    ignore_default_personality: boolean;
    rag: any;
    timezone: any;
    tools: any[];
    custom_llm_url: string;
    custom_llm_model_id: string;
    custom_llm_api_key: string;
    custom_llm_headers: { type: string; name: string; secret: string }[];
    enable_overrides: any;
  };
  
  // Widget Config
  widgetConfig?: {
    voice: string;
    multi_voice: boolean;
    use_flash: boolean;
    tts_output_format: string;
    pronunciation_dictionaries: string[];
    latency: number;
    stability: number;
    speed: number;
    similarity: number;
    feedback_collection: string;
    text_input: boolean;
    switch_to_text_only: boolean;
    conversation_transcript: boolean;
    language_dropdown: boolean;
    enable_muting: boolean;
    placement: string;
    require_terms: boolean;
    require_visitor_terms: boolean;
  };
  
  // Voice Config
  voiceConfig?: {
    model_id: string;
    voice: string;
    multi_voice: boolean;
    use_flash: boolean;
    tts_output_format: string;
    pronunciation_dictionaries: { pronunciation_dictionary_id: string; version_id: string }[];
    latency: number;
    stability: number;
    speed: number;
    similarity: number;
    multi_voice_ids: string[];
  };
  
  // Advanced Config
  advancedConfig?: {
    max_conversation_duration: number;
    keywords: string[];
    text_only: boolean;
    user_input_audio_format: string;
    client_events: string[];
    privacy_settings: {
      store_call_audio: boolean;
      zero_ppi_retention_mode: boolean;
    };
    conversations_retention_period: number;
    delete_transcript_and_derived_fields: boolean;
    delete_audio: boolean;
  };
  
  // Security Config
  securityConfig?: {
    enable_authentication: boolean;
    allowlist: string[];
    enable_overrides: any;
    fetch_initiation_client_data: boolean;
    post_call_webhook: string;
    enable_bursting: boolean;
    concurrent_calls_limit: number;
    daily_calls_limit: number;
  };
  
  // Analysis Config
  analysisConfig?: {
    evaluation_criteria: string[];
    data_collection: string[];
  };
  
  // Messages
  firstMessage?: string;
  systemPrompt?: string;
  
  // Variables
  first_message_vars?: string[];
  system_prompt_vars?: string[];
  dynamic_vars?: string[];
  
  // Export metadata
  exportedAt?: string;
  exportedBy?: string;
}

interface ImportedAgentDetails {
  name: string;
  description?: string;
  category?: string;
  language?: string;
  status?: string;
  agentData?: CompleteAgent;
}

// Sample agent template for import
const sampleAgentTemplate = {
  name: "Sample Agent",
  description: "A sample agent for import template.",
  useCase: "Lead Generation",
  tags: ["sample", "import"],
  language: "English (US)",
  status: "Draft",
  version: "1.0",
  source: "local",
  agentSettings: {
    language: "en",
    additional_languages: [],
    first_message: "Hello! How can I help you?",
    llm: "gpt-4.1-nano",
    temperature: 0.5,
    token_limit: 1024,
    tool_ids: [],
    built_in_tools: {},
    mcp_server_ids: [],
    native_mcp_server_ids: [],
    knowledge_base: [],
    custom_llm: null,
    ignore_default_personality: false,
    rag: {},
    timezone: null,
    tools: [],
    custom_llm_url: "",
    custom_llm_model_id: "",
    custom_llm_api_key: "",
    custom_llm_headers: [],
    enable_overrides: {},
  },
  widgetConfig: {
    voice: "Eric",
    multi_voice: false,
    use_flash: false,
    tts_output_format: "PCM 16000 Hz",
    pronunciation_dictionaries: [],
    latency: 0.5,
    stability: 0.5,
    speed: 0.5,
    similarity: 0.5,
    feedback_collection: "during",
    text_input: true,
    switch_to_text_only: true,
    conversation_transcript: false,
    language_dropdown: false,
    enable_muting: false,
    placement: "bottom-right",
    require_terms: true,
    require_visitor_terms: false,
  },
  voiceConfig: {
    model_id: "eleven_turbo_v2",
    voice: "Eric",
    multi_voice: false,
    use_flash: false,
    tts_output_format: "PCM 16000 Hz",
    pronunciation_dictionaries: [],
    latency: 0.5,
    stability: 0.5,
    speed: 0.5,
    similarity: 0.5,
    multi_voice_ids: [],
  },
  securityConfig: {
    enable_authentication: false,
    allowlist: [],
    enable_overrides: {},
    fetch_initiation_client_data: false,
    post_call_webhook: "",
    enable_bursting: false,
    concurrent_calls_limit: -1,
    daily_calls_limit: 100000,
  },
  advancedConfig: {
    max_conversation_duration: 300,
    keywords: [],
    text_only: false,
    user_input_audio_format: "pcm_16000",
    client_events: ["audio", "interruption", "user_transcript", "agent_response", "agent_response_correction"],
    privacy_settings: {
      store_call_audio: true,
      zero_ppi_retention_mode: false,
    },
    conversations_retention_period: 730,
    delete_transcript_and_derived_fields: false,
    delete_audio: false,
  },
  analysisConfig: {
    evaluation_criteria: [],
    data_collection: [],
  },
  firstMessage: "Hello! How can I help you?",
  systemPrompt: "You are a helpful AI agent.",
  first_message_vars: [],
  system_prompt_vars: [],
  dynamic_vars: [],
};

function downloadTemplate() {
  const json = JSON.stringify(sampleAgentTemplate, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "agent_template.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AiAgentImportExportPage() {
  const { toast } = useToast();
  const user = { userId: '1', name: 'Client User', email: 'client@example.com' };
  const [availableAgents, setAvailableAgents] = React.useState<CompleteAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = React.useState<string>("");
  const [isExporting, setIsExporting] = React.useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = React.useState(false);

  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState<string>("");
  const [isImporting, setIsImporting] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState(0);
  const [showImportConfirmation, setShowImportConfirmation] = React.useState(false);
  const [importedAgentDetails, setImportedAgentDetails] = React.useState<ImportedAgentDetails | null>(null);
  
  const [editName, setEditName] = React.useState("");
  const [editCategory, setEditCategory] = React.useState(""); 
  const [editStatus, setEditStatus] = React.useState<"Draft" | "Published">("Draft");

  // Load available agents for export
  React.useEffect(() => {
    if (user?.userId) {
      loadAvailableAgents();
    }
  }, [user?.userId]);

  const loadAvailableAgents = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingAgents) return;
    
    setIsLoadingAgents(true);
    try {
      // Try to fetch from APIs, but fall back to mock data if they fail
      let localAgents: CompleteAgent[] = [];
      let elevenLabsAgents: CompleteAgent[] = [];

      // Try local API
      try {
        const localResponse = await fetch('/api/agents');
        if (localResponse.ok) {
          const localData = await localResponse.json();
          if (Array.isArray(localData.data)) {
            // Filter agents by client_id and map them
            localAgents = localData.data
              .filter((agent: any) => {
                // Only include agents that belong to this client
                return agent.client_id && String(agent.client_id) === String(user?.userId);
              })
              .map((agent: any) => ({
                id: agent.agent_id,
                name: agent.name,
                description: agent.description,
                useCase: agent.description || 'Other',
                tags: agent.tags ? JSON.parse(agent.tags) : [],
                createdBy: user?.name || user?.email || 'You',
                language: agent.language_name || 'English (US)',
                lastModified: agent.updated_at,
                status: agent.status || 'Published',
                version: agent.model || '1.0',
                source: 'local',
                client_id: agent.client_id,
              }));
          }
        }
      } catch (error) {
        console.warn('Local API not available, using mock data');
      }

      // Try ElevenLabs API (only if we have an API key)
      if (process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY) {
        try {
          const elevenResponse = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
            headers: {
              'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
              'Content-Type': 'application/json',
            }
          });
          
          if (elevenResponse.ok) {
            const elevenData = await elevenResponse.json();
            let agentsArr = [];
            if (Array.isArray(elevenData.agents)) agentsArr = elevenData.agents;
            else if (Array.isArray(elevenData.items)) agentsArr = elevenData.items;
            else if (Array.isArray(elevenData.data)) agentsArr = elevenData.data;
            else if (Array.isArray(elevenData)) agentsArr = elevenData;

            elevenLabsAgents = agentsArr
              .filter((agent: any) => {
                // Only include agents that belong to this specific client
                return agent.client_id && String(agent.client_id) === String(user?.userId);
              })
              .map((agent: any) => ({
                id: agent.agent_id || agent.id,
                name: agent.name,
                description: agent.description,
                useCase: agent.description || 'Other',
                tags: agent.tags || [],
                createdBy: 'ElevenLabs',
                language: agent.language || 'English (US)',
                lastModified: agent.updated_at || agent.last_modified,
                status: 'Published',
                version: agent.model || '1.0',
                source: 'elevenlabs',
                client_id: agent.client_id,
              }));
          }
        } catch (error) {
          console.warn('ElevenLabs API not available, using mock data');
        }
      }

      // If no agents found from APIs, use mock data
      if (localAgents.length === 0 && elevenLabsAgents.length === 0) {
        const mockAgents: CompleteAgent[] = [
          {
            id: "mock_1",
            name: "Lead Qualification Pro",
            description: "Professional lead qualification agent",
            useCase: "Lead Generation",
            tags: ["sales", "b2b", "qualification"],
            createdBy: user?.name || 'You',
            language: "English (US)",
            lastModified: new Date().toISOString(),
            status: "Published",
            version: "1.2",
            source: 'local',
            client_id: user?.userId,
          },
          {
            id: "mock_2", 
            name: "Appointment Reminder",
            description: "Basic appointment reminder agent",
            useCase: "Reminder",
            tags: ["appointment", "customer service"],
            createdBy: 'ElevenLabs',
            language: "English (US)",
            lastModified: new Date().toISOString(),
            status: "Published",
            version: "1.0",
            source: 'elevenlabs',
            client_id: user?.userId,
          },
          {
            id: "mock_3",
            name: "Feedback Collector",
            description: "Customer feedback collection agent",
            useCase: "Feedback",
            tags: ["survey", "customer experience"],
            createdBy: user?.name || 'You',
            language: "English (US)",
            lastModified: new Date().toISOString(),
            status: "Draft",
            version: "0.8",
            source: 'local',
            client_id: user?.userId,
          }
        ];
        setAvailableAgents(mockAgents);
      } else {
        const merged = [...localAgents, ...elevenLabsAgents.filter(ea => !localAgents.some(la => la.id === ea.id))];
        setAvailableAgents(merged);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      // Fall back to mock data on complete failure
      const fallbackAgents: CompleteAgent[] = [
        {
          id: "fallback_1",
          name: "Sample Agent",
          description: "Sample agent for demonstration",
          useCase: "Other",
          tags: ["sample"],
          createdBy: user?.name || 'You',
          language: "English (US)",
          lastModified: new Date().toISOString(),
          status: "Published",
          version: "1.0",
          source: 'local',
          client_id: user?.userId,
        }
      ];
      setAvailableAgents(fallbackAgents);
      toast({
        title: "Using Demo Data",
        description: "API not available. Showing sample agents for demonstration.",
      });
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const handleExport = async () => {
    if (!selectedAgentId) {
      toast({
        title: "No Agent Selected",
        description: "Please select an agent to export.",
        variant: "destructive",
      });
      return;
    }
    
    setIsExporting(true);
    const agentToExport = availableAgents.find(agent => agent.id === selectedAgentId);

    if (!agentToExport) {
      toast({
        title: "Agent Not Found",
        description: "Selected agent could not be found.",
        variant: "destructive",
      });
      setIsExporting(false);
      return;
    }

    try {
      // Fetch complete agent configuration
      let completeAgentData = { ...agentToExport };
      
      // Fetch detailed configuration based on source
      if (agentToExport.source === 'local') {
        // For local agents, fetch from local API
        try {
          const response = await fetch(`/api/agents`);
          if (response.ok) {
            const allAgentsData = await response.json();
            const detailedAgent = allAgentsData.data?.find((agent: any) => agent.agent_id === agentToExport.id);
            
            if (detailedAgent) {
              // Parse platform_settings JSON
              let platformSettings: any = {};
              try {
                platformSettings = JSON.parse(detailedAgent.platform_settings || '{}');
              } catch (e) {
                console.warn('Could not parse platform_settings:', e);
              }
              
              // Parse additional_languages JSON
              let additionalLanguages = [];
              try {
                additionalLanguages = JSON.parse(detailedAgent.additional_languages || '[]');
              } catch (e) {
                console.warn('Could not parse additional_languages:', e);
              }
              
              // Parse custom_llm_headers JSON
              let customLlmHeaders = [];
              try {
                customLlmHeaders = JSON.parse(detailedAgent.custom_llm_headers || '[]');
              } catch (e) {
                console.warn('Could not parse custom_llm_headers:', e);
              }
              
              completeAgentData = {
                ...completeAgentData,
                // Agent Settings
                agentSettings: {
                  language: detailedAgent.language_code || 'en',
                  additional_languages: additionalLanguages,
                  first_message: detailedAgent.first_message || '',
                  llm: detailedAgent.llm || '',
                  temperature: detailedAgent.temperature || 0.5,
                  token_limit: detailedAgent.token_limit || 0,
                  tool_ids: [],
                  built_in_tools: {},
                  mcp_server_ids: [],
                  native_mcp_server_ids: [],
                  knowledge_base: [],
                  custom_llm: null,
                  ignore_default_personality: false,
                  rag: {},
                  timezone: null,
                  tools: [],
                  custom_llm_url: detailedAgent.custom_llm_url || '',
                  custom_llm_model_id: detailedAgent.custom_llm_model_id || '',
                  custom_llm_api_key: detailedAgent.custom_llm_api_key || '',
                  custom_llm_headers: customLlmHeaders,
                  enable_overrides: platformSettings.overrides || {},
                },
                
                // Widget Config (from platform_settings)
                widgetConfig: {
                  voice: platformSettings.widget?.avatar?.type || 'Eric',
                  multi_voice: false,
                  use_flash: false,
                  tts_output_format: "PCM 16000 Hz",
                  pronunciation_dictionaries: [],
                  latency: 0.5,
                  stability: 0.5,
                  speed: 0.5,
                  similarity: 0.5,
                  feedback_collection: platformSettings.widget?.feedback_mode || "During conversation",
                  text_input: platformSettings.widget?.text_input_enabled || false,
                  switch_to_text_only: platformSettings.widget?.supports_text_only || false,
                  conversation_transcript: platformSettings.widget?.transcript_enabled || false,
                  language_dropdown: platformSettings.widget?.language_selector || false,
                  enable_muting: platformSettings.widget?.mic_muting_enabled || false,
                  placement: platformSettings.widget?.placement || "Bottom-right",
                  require_terms: platformSettings.widget?.shareable_page_show_terms || false,
                  require_visitor_terms: false,
                },
                
                // Voice Config
                voiceConfig: {
                  model_id: 'eleven_turbo_v2',
                  voice: platformSettings.widget?.avatar?.type || "Eric",
                  multi_voice: false,
                  use_flash: false,
                  tts_output_format: "PCM 16000 Hz",
                  pronunciation_dictionaries: [],
                  latency: 0.5,
                  stability: 0.5,
                  speed: 0.5,
                  similarity: 0.5,
                  multi_voice_ids: [],
                },
                
                // Security Config (from platform_settings)
                securityConfig: {
                  enable_authentication: platformSettings.auth?.enable_auth || false,
                  allowlist: platformSettings.auth?.allowlist || [],
                  enable_overrides: platformSettings.overrides || {},
                  fetch_initiation_client_data: platformSettings.overrides?.enable_conversation_initiation_client_data_from_webhook || false,
                  post_call_webhook: platformSettings.workspace_overrides?.webhooks?.post_call_webhook_id || '',
                  enable_bursting: platformSettings.call_limits?.bursting_enabled || false,
                  concurrent_calls_limit: platformSettings.call_limits?.agent_concurrency_limit || -1,
                  daily_calls_limit: platformSettings.call_limits?.daily_limit || 100000,
                },
                
                // Advanced Config (from platform_settings)
                advancedConfig: {
                  max_conversation_duration: 300,
                  keywords: [],
                  text_only: platformSettings.overrides?.conversation_config_override?.conversation?.text_only || false,
                  user_input_audio_format: "pcm_16000",
                  client_events: ["audio", "interruption", "user_transcript", "agent_response", "agent_response_correction"],
                  privacy_settings: {
                    store_call_audio: platformSettings.privacy?.record_voice || true,
                    zero_ppi_retention_mode: platformSettings.privacy?.zero_retention_mode || false,
                  },
                  conversations_retention_period: platformSettings.privacy?.retention_days || 730,
                  delete_transcript_and_derived_fields: platformSettings.privacy?.delete_transcript_and_pii || false,
                  delete_audio: platformSettings.privacy?.delete_audio || false,
                },
                
                // Analysis Config (from platform_settings)
                analysisConfig: {
                  evaluation_criteria: platformSettings.evaluation?.criteria || [],
                  data_collection: Object.keys(platformSettings.data_collection || {}),
                },
                
                // Messages
                firstMessage: detailedAgent.first_message || '',
                systemPrompt: detailedAgent.system_prompt || '',
                
                // Variables (empty arrays for now)
                first_message_vars: [],
                system_prompt_vars: [],
                dynamic_vars: [],
              };
            }
          }
        } catch (error) {
          console.warn('Could not fetch detailed local configuration:', error);
        }
      } else if (agentToExport.source === 'elevenlabs') {
        // For ElevenLabs agents, fetch from ElevenLabs API
        try {
          const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentToExport.id}`, {
            headers: {
              'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
              'Content-Type': 'application/json',
            }
          });
          
          if (response.ok) {
            const detailedData = await response.json();
            
            // Dynamically merge all ElevenLabs data with our base structure
            completeAgentData = {
              ...completeAgentData,
              // Include all the original ElevenLabs data
              ...detailedData,
              
              // Also map to our structured format for compatibility
              agentSettings: detailedData.agent_settings || {},
              voiceConfig: detailedData.voice_config || {},
              widgetConfig: detailedData.widget_config || {},
              securityConfig: detailedData.security_config || {},
              advancedConfig: detailedData.advanced_config || {},
              analysisConfig: detailedData.analysis_config || {},
              firstMessage: detailedData.first_message || '',
              systemPrompt: detailedData.system_prompt || '',
              first_message_vars: detailedData.first_message_vars || [],
              system_prompt_vars: detailedData.system_prompt_vars || [],
              dynamic_vars: detailedData.dynamic_vars || [],
              
              // Add any additional fields that might exist
              ...(detailedData.agent_id && { agent_id: detailedData.agent_id }),
              ...(detailedData.created_at && { created_at: detailedData.created_at }),
              ...(detailedData.updated_at && { updated_at: detailedData.updated_at }),
              ...(detailedData.status && { status: detailedData.status }),
              ...(detailedData.description && { description: detailedData.description }),
              ...(detailedData.language && { language: detailedData.language }),
              ...(detailedData.tags && { tags: detailedData.tags }),
              ...(detailedData.model && { model: detailedData.model }),
              ...(detailedData.temperature && { temperature: detailedData.temperature }),
              ...(detailedData.token_limit && { token_limit: detailedData.token_limit }),
              ...(detailedData.llm && { llm: detailedData.llm }),
              ...(detailedData.custom_llm_url && { custom_llm_url: detailedData.custom_llm_url }),
              ...(detailedData.custom_llm_model_id && { custom_llm_model_id: detailedData.custom_llm_model_id }),
              ...(detailedData.custom_llm_api_key && { custom_llm_api_key: detailedData.custom_llm_api_key }),
              ...(detailedData.custom_llm_headers && { custom_llm_headers: detailedData.custom_llm_headers }),
              ...(detailedData.additional_languages && { additional_languages: detailedData.additional_languages }),
              ...(detailedData.platform_settings && { platform_settings: detailedData.platform_settings }),
              ...(detailedData.workspace_id && { workspace_id: detailedData.workspace_id }),
              ...(detailedData.user_id && { user_id: detailedData.user_id }),
              ...(detailedData.client_id && { client_id: detailedData.client_id }),
            };
          }
        } catch (error) {
          console.warn('Could not fetch detailed ElevenLabs configuration:', error);
        }
      }

      // Create a comprehensive export object
      const exportData = {
        ...completeAgentData,
        exportedAt: new Date().toISOString(),
        exportedBy: user?.name || user?.email || 'Unknown',
      } as CompleteAgent;

      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${agentToExport.name.replace(/\s+/g, '_')}_${agentToExport.version || 'v1.0'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Agent "${agentToExport.name}" has been exported with complete configuration.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json") {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid .json file.",
        variant: "destructive",
      });
      resetImportState();
      return;
    }

        setSelectedFile(file);
        setFileName(file.name);
        setShowImportConfirmation(false); 
        setImportedAgentDetails(null);
        
        setIsImporting(true);
        setImportProgress(0);

    try {
      // Simulate processing progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Read and parse the file
      const text = await file.text();
      const parsedData: CompleteAgent = JSON.parse(text);
      
      clearInterval(progressInterval);
      setImportProgress(100);

      // Extract and map the data
      const mappedData: ImportedAgentDetails = {
        name: parsedData.name || file.name.replace('.json', ''),
        description: parsedData.description || parsedData.useCase || 'Imported agent',
        category: parsedData.useCase || 'Other',
        language: parsedData.language || 'English (US)',
        status: parsedData.status || 'Draft',
        agentData: parsedData,
      };

      setImportedAgentDetails(mappedData);
      setEditName(mappedData.name);
      setEditCategory(mappedData.category || 'Other');
      setEditStatus((mappedData.status as "Draft" | "Published") || 'Draft');
      setShowImportConfirmation(true);

      toast({
        title: "File Processed Successfully",
        description: `Found agent: ${mappedData.name}. Review and finalize import.`,
      });

    } catch (error) {
      console.error('Import error:', error);
        toast({
        title: "Import Error",
        description: "Could not parse JSON file. Please check the file format.",
          variant: "destructive",
        });
        resetImportState();
    } finally {
      setIsImporting(false);
    }
  };
  
  const resetImportState = () => {
    setSelectedFile(null);
    setFileName("");
    setIsImporting(false);
    setImportProgress(0);
    setShowImportConfirmation(false);
    setImportedAgentDetails(null);
  };

    const handleFinalizeImport = async (status: "Draft" | "Published") => {
    if (!importedAgentDetails?.agentData) return;
    
    const finalName = editName || importedAgentDetails.name;
    const finalCategory = editCategory || importedAgentDetails.category || 'Other';

    try {
      // Prepare the import payload based on the source
      let importPayload: any = {
        name: finalName,
        description: finalCategory,
        status: status,
        client_id: user?.userId,
        language_id: 4, // Default to English (US)
        first_message: importedAgentDetails.agentData.firstMessage || importedAgentDetails.agentData.agentSettings?.first_message || '',
        system_prompt: importedAgentDetails.agentData.systemPrompt || '',
        llm: importedAgentDetails.agentData.agentSettings?.llm || 'gpt-4.1-nano',
        temperature: importedAgentDetails.agentData.agentSettings?.temperature || 0.5,
        token_limit: importedAgentDetails.agentData.agentSettings?.token_limit || -1,
        tags: JSON.stringify(importedAgentDetails.agentData.tags || []),
        additional_languages: JSON.stringify(importedAgentDetails.agentData.agentSettings?.additional_languages || []),
        custom_llm_url: importedAgentDetails.agentData.agentSettings?.custom_llm_url || '',
        custom_llm_model_id: importedAgentDetails.agentData.agentSettings?.custom_llm_model_id || '',
        custom_llm_api_key: importedAgentDetails.agentData.agentSettings?.custom_llm_api_key || '',
        custom_llm_headers: JSON.stringify(importedAgentDetails.agentData.agentSettings?.custom_llm_headers || []),
      };

      // Prepare platform_settings from the imported data
      const platformSettings = {
        auth: {
          enable_auth: importedAgentDetails.agentData.securityConfig?.enable_authentication || false,
          allowlist: importedAgentDetails.agentData.securityConfig?.allowlist || [],
          shareable_token: null
        },
        evaluation: {
          criteria: importedAgentDetails.agentData.analysisConfig?.evaluation_criteria || []
        },
        widget: {
          variant: "full",
          placement: importedAgentDetails.agentData.widgetConfig?.placement || "bottom-right",
          expandable: "never",
          avatar: {
            type: importedAgentDetails.agentData.widgetConfig?.voice || "orb",
            color_1: "#2792dc",
            color_2: "#9ce6e6"
          },
          feedback_mode: importedAgentDetails.agentData.widgetConfig?.feedback_collection || "during",
          bg_color: "#ffffff",
          text_color: "#000000",
          btn_color: "#000000",
          btn_text_color: "#ffffff",
          border_color: "#e1e1e1",
          focus_color: "#000000",
          border_radius: null,
          btn_radius: null,
          action_text: null,
          start_call_text: null,
          end_call_text: null,
          expand_text: null,
          listening_text: null,
          speaking_text: null,
          shareable_page_text: null,
          shareable_page_show_terms: importedAgentDetails.agentData.widgetConfig?.require_terms || true,
          terms_text: "#### Terms and conditions\n\nBy clicking \"Agree,\" and each time I interact with this AI agent, I consent to the recording, storage, and sharing of my communications with third-party service providers, and as described in the Privacy Policy.\nIf you do not wish to have your conversations recorded, please refrain from using this service.",
          terms_html: null,
          terms_key: null,
          show_avatar_when_collapsed: false,
          disable_banner: false,
          override_link: null,
          mic_muting_enabled: importedAgentDetails.agentData.widgetConfig?.enable_muting || false,
          transcript_enabled: importedAgentDetails.agentData.widgetConfig?.conversation_transcript || false,
          text_input_enabled: importedAgentDetails.agentData.widgetConfig?.text_input || true,
          language_selector: importedAgentDetails.agentData.widgetConfig?.language_dropdown || false,
          supports_text_only: importedAgentDetails.agentData.widgetConfig?.switch_to_text_only || true,
          custom_avatar_path: null,
          language_presets: {}
        },
        data_collection: {},
        overrides: {
          conversation_config_override: {
            tts: {
              voice_id: false
            },
            conversation: {
              text_only: importedAgentDetails.agentData.advancedConfig?.text_only || true
            },
            agent: {
              first_message: false,
              language: false,
              prompt: {
                prompt: false
              }
            }
          },
          custom_llm_extra_body: false,
          enable_conversation_initiation_client_data_from_webhook: importedAgentDetails.agentData.securityConfig?.fetch_initiation_client_data || false
        },
        call_limits: {
          agent_concurrency_limit: importedAgentDetails.agentData.securityConfig?.concurrent_calls_limit || -1,
          daily_limit: importedAgentDetails.agentData.securityConfig?.daily_calls_limit || 100000,
          bursting_enabled: importedAgentDetails.agentData.securityConfig?.enable_bursting || true
        },
        ban: null,
        privacy: {
          record_voice: importedAgentDetails.agentData.advancedConfig?.privacy_settings?.store_call_audio || true,
          retention_days: importedAgentDetails.agentData.advancedConfig?.conversations_retention_period || -1,
          delete_transcript_and_pii: importedAgentDetails.agentData.advancedConfig?.delete_transcript_and_derived_fields || false,
          delete_audio: importedAgentDetails.agentData.advancedConfig?.delete_audio || false,
          apply_to_existing_conversations: false,
          zero_retention_mode: importedAgentDetails.agentData.advancedConfig?.privacy_settings?.zero_ppi_retention_mode || false
        },
        workspace_overrides: {
          conversation_initiation_client_data_webhook: null,
          webhooks: {
            post_call_webhook_id: importedAgentDetails.agentData.securityConfig?.post_call_webhook || null,
            send_audio: false
          }
        },
        testing: {
          test_ids: []
        },
        safety: {
          is_blocked_ivc: false,
          is_blocked_non_ivc: false,
          ignore_safety_evaluation: false
        }
      };

      importPayload.platform_settings = JSON.stringify(platformSettings);

      console.log('Importing agent:', importPayload);

      // Make API call to create the agent
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importPayload),
      });

      if (response.ok) {
        const result = await response.json();

    toast({
          title: `Import Complete`,
          description: `Agent "${finalName}" imported as ${status}. Category: ${finalCategory}.`,
    });
        
    resetImportState();
        
        // Reload agents list to show the new agent
        await loadAvailableAgents();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create agent');
      }
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import agent. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold font-headline flex items-center">
          Import & Export AI Agents
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Download className="mr-3 h-6 w-6 text-primary" /> Export Agent
            </CardTitle>
            <CardDescription>
              Select an existing agent to download its complete configuration as a JSON file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="select-agent-export">Agent to Export</Label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger id="select-agent-export">
                  <SelectValue placeholder={isLoadingAgents ? "Loading agents..." : "Choose an agent..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{agent.name}</span>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant="outline" className="text-xs">
                            {agent.source || 'local'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            v{agent.version || '1.0'}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableAgents.length === 0 && !isLoadingAgents && (
                <p className="text-sm text-muted-foreground">No agents available for export.</p>
              )}
            </div>
            
            {selectedAgentId && (
              <div className="p-3 bg-muted rounded-md">
                <h4 className="font-medium mb-2">Export Includes:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Agent basic information (name, description, tags)</li>
                  <li>• Voice and widget configuration</li>
                  <li>• Advanced settings and security config</li>
                  <li>• System prompts and messages</li>
                  <li>• Knowledge base and tools</li>
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleExport}
              disabled={isExporting || !selectedAgentId || isLoadingAgents}
              className="w-full text-base py-3"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" /> Export Complete Configuration
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <UploadCloud className="mr-3 h-6 w-6 text-primary" /> Import Agent
            </CardTitle>
            <CardDescription>
              Upload a JSON file to import a complete AI agent configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-end mb-4">
              <a
                href="/agent_template.json"
                download
                className="inline-flex items-center h-7 px-2 py-0.5 text-xs border rounded hover:bg-gray-100 transition"
                style={{ fontWeight: 500 }}
              >
                <span className="mr-1" style={{ fontSize: 14 }}>{"{"}{"}"}</span>
                Download JSON Template
              </a>
            </div>
            <div>
              <Label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary/80 focus:outline-none"
              >
                <span className="flex items-center space-x-2">
                  <UploadCloud className="w-6 h-6 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">
                    {fileName ? fileName : "Click to upload or drag & drop JSON file"}
                  </span>
                </span>
                <Input id="file-upload" type="file" accept=".json" onChange={handleFileChange} className="sr-only" />
              </Label>
              {fileName && !isImporting && !showImportConfirmation && (
                <p className="text-xs text-muted-foreground mt-1">Selected: {fileName}</p>
              )}
            </div>

            {isImporting && (
              <div className="space-y-2 pt-2">
                <Label>Processing file...</Label>
                <Progress value={importProgress} className="w-full h-2.5" />
                <p className="text-sm text-muted-foreground text-center animate-pulse">{importProgress}%</p>
              </div>
            )}
            
            {showImportConfirmation && importedAgentDetails && (
                <div className="pt-4 border-t">
                    <h3 className="text-md font-semibold mb-3">Review & Finalize Import</h3>
                    <div className="space-y-3">
                         <div className="space-y-1">
                            <Label htmlFor="edit-name">Agent Name*</Label>
                    <Input 
                      id="edit-name" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      placeholder="Enter agent name" 
                    />
                        </div>
                        <div className="space-y-1">
                             <Label htmlFor="edit-category">Category*</Label>
                    <Input 
                      id="edit-category" 
                      value={editCategory} 
                      onChange={e => setEditCategory(e.target.value)} 
                      placeholder="e.g., Lead Generation" 
                    />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="edit-status">Set Status*</Label>
                             <Select value={editStatus} onValueChange={(value) => setEditStatus(value as "Draft" | "Published")}>
                                <SelectTrigger id="edit-status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                  
                  {importedAgentDetails.agentData && (
                    <div className="p-3 bg-muted rounded-md">
                      <h4 className="font-medium mb-2">Detected Configuration:</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {importedAgentDetails.agentData.agentSettings && <p>• Agent settings and LLM config</p>}
                        {importedAgentDetails.agentData.voiceConfig && <p>• Voice configuration</p>}
                        {importedAgentDetails.agentData.widgetConfig && <p>• Widget settings</p>}
                        {importedAgentDetails.agentData.securityConfig && <p>• Security and authentication</p>}
                        {importedAgentDetails.agentData.advancedConfig && <p>• Advanced conversation settings</p>}
                        {importedAgentDetails.agentData.firstMessage && <p>• First message</p>}
                        {importedAgentDetails.agentData.systemPrompt && <p>• System prompt</p>}
                      </div>
                    </div>
                  )}
                    </div>
                </div>
            )}
          </CardContent>
           <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4">
            {showImportConfirmation ? (
              <>
                <Button onClick={() => handleFinalizeImport("Draft")} variant="secondary" className="w-full sm:w-auto">
                  <Edit3 className="mr-2 h-4 w-4" /> Import & Save as Draft
                </Button>
                <Button onClick={() => handleFinalizeImport("Published")} className="w-full sm:w-auto">
                  <CheckCircle className="mr-2 h-4 w-4" /> Import & Publish
                </Button>
              </>
            ) : (
                 <Button onClick={() => document.getElementById('file-upload')?.click()} disabled={isImporting} className="w-full text-base py-3">
                    {isImporting ? (
                        <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Importing...
                        </>
                    ) : (
                        <>
                         <FileJson className="mr-2 h-5 w-5" /> Choose JSON File
                        </>
                    )}
                 </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      
      <Separator />
      
      <Card className="mt-8">
        <CardHeader>
            <CardTitle>How it Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>Exporting:</strong> Select one of your existing agents from the dropdown. The system will export the complete agent configuration including all settings, voice config, widget settings, security settings, and conversation flows. This creates a comprehensive backup or sharing file.</p>
          <p><strong>Importing:</strong> Upload a JSON file containing a complete agent configuration. The system automatically maps all fields to their corresponding settings in the agent details page. You can review and modify basic details like name and category before finalizing the import.</p>
          <p><strong>JSON Structure:</strong> The exported JSON contains all agent fields including <code>agentSettings</code>, <code>voiceConfig</code>, <code>widgetConfig</code>, <code>securityConfig</code>, <code>advancedConfig</code>, <code>firstMessage</code>, <code>systemPrompt</code>, and all associated variables and tools.</p>
        </CardContent>
      </Card>
    </div>
  );
}
