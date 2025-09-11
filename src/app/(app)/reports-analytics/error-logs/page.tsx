
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/cn";
import { format, subDays, addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  AlertTriangle,
  CalendarClock,
  Users,
  Megaphone,
  ListFilter,
  FileDown,
  FilterX,
  Check,
  ChevronsUpDown,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  CalendarDays,
  ShieldAlert,
  MoreHorizontal,
  Loader2
} from "lucide-react";
import elevenLabsApi from "@/lib/elevenlabsApi";
import { api } from '@/lib/apiConfig';
import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'Error & Failed Call Logs - AI Caller',
//   description: 'Investigate system errors, failed calls, and manage resolutions. Filter logs by date, client, campaign, and error type.',
//   keywords: ['error logs', 'failed calls', 'call troubleshooting', 'system errors', 'AI Caller logs'],
// };

type ErrorType = "Call Failed" | "No Answer" | "Network Error" | "TTS Error" | "Agent Error" | "Validation Error" | "API Limit Exceeded" | "Authentication Failed" | "Permission Denied" | "Timeout" | "System Error" | "SIP Error" | "Phone Provider Error" | "Connection Error" | "Unknown Status" | "Call Not Completed" | "Busy Signal" | "Voicemail" | "Invalid Number" | "Call Dropped" | "Audio Quality Issue" | "Rate Limited" | "Service Unavailable" | "Configuration Error" | "Hardware Failure" | "Software Bug" | "External Service Down" | "Insufficient Credits" | "Account Suspended" | "Feature Not Available";
type ResolvedStatus = "Yes" | "No" | "Investigating";

interface ErrorLogEntry {
  id: string;
  callId: string;
  conversationId: string;
  clientName: string;
  clientId: string;
  campaignName: string;
  campaignId: string;
  agentId: string;
  agentName: string;
  timestamp: Date;
  errorType: ErrorType;
  errorDescription: string;
  isResolved: ResolvedStatus;
  callDuration?: number;
  phoneNumber?: string;
  callStatus?: string;
  errorCode?: string;
  stackTrace?: string;
  sipStatus?: string;
  fullErrorMessage?: string;
}

interface Agent {
  agent_id: string;
  name: string;
  client_id?: number;
}

interface Conversation {
  conversation_id: string;
  agent_id: string;
  call_start_unix: number;
  call_end_unix?: number;
  call_successful: boolean;
  call_duration_seconds?: number;
  phone_number?: string;
  error_message?: string;
  error_code?: string;
  summary?: {
    error_details?: string;
    call_outcome?: string;
    error_reason?: string;
  };
  call_status?: string;
  failure_reason?: string;
}

interface FilterOption {
  value: string;
  label: string;
}

const errorTypeOptions: ErrorType[] = [
  "Call Failed", "No Answer", "Network Error", "TTS Error", "Agent Error", 
  "Validation Error", "API Limit Exceeded", "Authentication Failed", 
  "Permission Denied", "Timeout", "System Error", "SIP Error", 
  "Phone Provider Error", "Connection Error", "Unknown Status", 
  "Call Not Completed", "Busy Signal", "Voicemail", "Invalid Number", 
  "Call Dropped", "Audio Quality Issue", "Rate Limited", 
  "Service Unavailable", "Configuration Error", "Hardware Failure", 
  "Software Bug", "External Service Down", "Insufficient Credits", 
  "Account Suspended", "Feature Not Available"
];

// Helper function to convert technical error messages to simple language
const simplifyErrorMessage = (errorMessage: string): string => {
  const error = errorMessage.toLowerCase();
  
  // SIP Errors
  if (error.includes('sip status: 404') || error.includes('notfound')) {
    return "Phone number not found or doesn't exist";
  }
  if (error.includes('sip status: 486') || error.includes('busy here')) {
    return "Phone is busy or line is engaged";
  }
  if (error.includes('sip status: 480') || error.includes('temporarily unavailable')) {
    return "Phone is temporarily unavailable";
  }
  if (error.includes('sip status: 503') || error.includes('service unavailable')) {
    return "Phone service is unavailable";
  }
  if (error.includes('sip status: 408') || error.includes('request timeout')) {
    return "Call timed out - no response from phone";
  }
  if (error.includes('sip status: 500') || error.includes('internal server error')) {
    return "Phone system internal error";
  }
  if (error.includes('sip status: 403') || error.includes('forbidden')) {
    return "Call blocked or forbidden";
  }
  if (error.includes('sip status: 401') || error.includes('unauthorized')) {
    return "Call authentication failed";
  }
  if (error.includes('sip status: 600') || error.includes('busy everywhere')) {
    return "All lines are busy";
  }
  if (error.includes('sip status: 603') || error.includes('decline')) {
    return "Call was declined";
  }
  if (error.includes('sip status: 606') || error.includes('not acceptable')) {
    return "Call format not acceptable";
  }
  
  // Connection Errors
  if (error.includes('connection') || error.includes('connectivity')) {
    return "Unable to connect to the phone network";
  }
  if (error.includes('dial') || error.includes('dialing')) {
    return "Failed to dial the phone number";
  }
  
  // Network Errors
  if (error.includes('network') || error.includes('dns')) {
    return "Network connection problem";
  }
  if (error.includes('timeout') || error.includes('timed out')) {
    return "Call took too long and was cancelled";
  }
  
  // TTS Errors
  if (error.includes('tts') || error.includes('voice') || error.includes('synthesis')) {
    return "Voice generation failed";
  }
  
  // Agent Errors
  if (error.includes('agent') || error.includes('bot') || error.includes('script')) {
    return "AI agent encountered an error";
  }
  
  // API Errors
  if (error.includes('rate limit') || error.includes('quota')) {
    return "Too many calls made - limit reached";
  }
  if (error.includes('auth') || error.includes('unauthorized')) {
    return "Authentication failed";
  }
  
  // Phone Provider Errors
  if (error.includes('no answer') || error.includes('unanswered')) {
    return "No one answered the phone";
  }
  if (error.includes('busy') || error.includes('engaged')) {
    return "Phone line is busy";
  }
  if (error.includes('unavailable')) {
    return "Phone number is unavailable";
  }
  
  // Generic fallback
  return "Call failed for an unknown reason";
};

// Helper function to categorize errors from ElevenLabs data
const categorizeError = (conversation: Conversation): { type: ErrorType; description: string; errorCode?: string; sipStatus?: string } => {
  // Handle unknown status calls (calls that don't have clear success/failure status)
  if (conversation.call_successful === undefined || conversation.call_successful === null) {
    return { 
      type: "Unknown Status", 
      description: "Call status is unknown - may still be in progress",
      errorCode: conversation.error_code
    };
  }
  
  // Handle calls that are not successful
  if (!conversation.call_successful) {
    if (conversation.error_message) {
      const errorMsg = conversation.error_message.toLowerCase();
      const simpleDescription = simplifyErrorMessage(conversation.error_message);
      
      // SIP Errors (like the one shown in the image)
      if (errorMsg.includes('sip') || errorMsg.includes('invite failed')) {
        const sipMatch = conversation.error_message.match(/sip status: (\d+)/i);
        const sipStatus = sipMatch ? sipMatch[1] : undefined;
        return { 
          type: "SIP Error", 
          description: simpleDescription,
          errorCode: conversation.error_code,
          sipStatus: sipStatus
        };
      }
      
      // Phone Provider Errors
      if (errorMsg.includes('notfound') || errorMsg.includes('404')) {
        return { 
          type: "Invalid Number", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      if (errorMsg.includes('busy') || errorMsg.includes('engaged') || errorMsg.includes('486')) {
        return { 
          type: "Busy Signal", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      if (errorMsg.includes('voicemail') || errorMsg.includes('answering machine')) {
        return { 
          type: "Voicemail", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      if (errorMsg.includes('dropped') || errorMsg.includes('disconnected')) {
        return { 
          type: "Call Dropped", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      if (errorMsg.includes('audio quality') || errorMsg.includes('echo') || errorMsg.includes('feedback')) {
        return { 
          type: "Audio Quality Issue", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      if (errorMsg.includes('unavailable') || errorMsg.includes('503')) {
        return { 
          type: "Service Unavailable", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      
      // Connection Errors
      if (errorMsg.includes('connection') || errorMsg.includes('connectivity') || errorMsg.includes('dial')) {
        return { 
          type: "Connection Error", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      
      // Timeout Errors
      if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
        return { 
          type: "Timeout", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      
      // Network Errors
      if (errorMsg.includes('network') || errorMsg.includes('dns') || errorMsg.includes('resolve')) {
        return { 
          type: "Network Error", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      
      // TTS Errors
      if (errorMsg.includes('tts') || errorMsg.includes('voice') || errorMsg.includes('synthesis')) {
        return { 
          type: "TTS Error", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      
      // Agent Errors
      if (errorMsg.includes('agent') || errorMsg.includes('bot') || errorMsg.includes('script')) {
        return { 
          type: "Agent Error", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      
      // API Limit Errors
      if (errorMsg.includes('rate limit') || errorMsg.includes('quota') || errorMsg.includes('limit exceeded')) {
        return { 
          type: "Rate Limited", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      if (errorMsg.includes('insufficient') || errorMsg.includes('credit') || errorMsg.includes('balance')) {
        return { 
          type: "Insufficient Credits", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      if (errorMsg.includes('suspended') || errorMsg.includes('disabled') || errorMsg.includes('403')) {
        return { 
          type: "Account Suspended", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      if (errorMsg.includes('maintenance') || errorMsg.includes('down') || errorMsg.includes('unavailable')) {
        return { 
          type: "Service Unavailable", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      
      // Authentication Errors
      if (errorMsg.includes('auth') || errorMsg.includes('unauthorized') || errorMsg.includes('forbidden')) {
        return { 
          type: "Authentication Failed", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      
      // Validation Errors
      if (errorMsg.includes('validation') || errorMsg.includes('invalid')) {
        return { 
          type: "Validation Error", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      
      // No Answer Errors
      if (errorMsg.includes('no answer') || errorMsg.includes('unanswered')) {
        return { 
          type: "No Answer", 
          description: simpleDescription,
          errorCode: conversation.error_code
        };
      }
      
      // Generic Call Failed
      return { 
        type: "Call Failed", 
        description: simpleDescription,
        errorCode: conversation.error_code
      };
    }
    
    // If no error message but call failed, check duration
    if (conversation.call_duration_seconds && conversation.call_duration_seconds < 5) {
      return { 
        type: "No Answer", 
        description: "No one answered the phone",
        errorCode: conversation.error_code
      };
    }
    
    return { 
      type: "Call Not Completed", 
      description: "Call did not complete successfully",
      errorCode: conversation.error_code
    };
  }
  
  // Handle successful calls that might have issues
  if (conversation.call_successful && conversation.call_duration_seconds && conversation.call_duration_seconds < 3) {
    return { 
      type: "Call Not Completed", 
      description: "Call ended very quickly - may have had issues",
      errorCode: conversation.error_code
    };
  }
  
  return { 
    type: "System Error", 
    description: "Unexpected call status",
    errorCode: conversation.error_code
  };
};

const resolvedStatusColors: Record<ResolvedStatus, string> = {
  Yes: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
  No: "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
  Investigating: "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100",
};


export default function ErrorLogsPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({ from: subDays(new Date(), 7), to: new Date() });
  const [selectedAgentId, setSelectedAgentId] = React.useState<string>("all");
  const [selectedErrorType, setSelectedErrorType] = React.useState<ErrorType | "all">("all");
  
  const [errorLogs, setErrorLogs] = React.useState<ErrorLogEntry[]>([]);
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [clients, setClients] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [usageStats, setUsageStats] = React.useState<any>(null);
  const [agentsLoading, setAgentsLoading] = React.useState(true);
  
  // Debug: Log initial state
  React.useEffect(() => {
    console.log('Component mounted with initial state:', {
      dateRange,
      selectedAgentId,
      agents: agents.length
    });
  }, []);

  const [agentOpen, setAgentOpen] = React.useState(false);
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Fetch agents and clients on component mount
  React.useEffect(() => {
    async function fetchAgents() {
      setAgentsLoading(true);
      try {
        console.log('Fetching agents...');
        const response = await fetch('/api/agents');
        console.log('Agents API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Agents data:', data);
          
          // Handle different possible response structures
          let agentsList = [];
          if (data.success && data.data && Array.isArray(data.data)) {
            // Backend API structure: { success: true, data: [...] }
            agentsList = data.data;
          } else if (data.agents) {
            agentsList = data.agents;
          } else if (Array.isArray(data)) {
            agentsList = data;
          }
          
          console.log('Processed agents list:', agentsList);
          setAgents(agentsList);
        } else {
          console.error('Failed to fetch agents:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error response:', errorText);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setAgentsLoading(false);
      }
    }

    async function fetchClients() {
      try {
        console.log('Fetching clients...');
        const response = await fetch('/api/clients');
        console.log('Clients API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Clients data:', data);
          
          if (data.success && data.data && Array.isArray(data.data)) {
            setClients(data.data);
          }
        } else {
          console.error('Failed to fetch clients:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    }

    fetchAgents();
    fetchClients();
  }, []);

  // Fetch error logs from ElevenLabs
  React.useEffect(() => {
    async function fetchErrorLogs() {
      if (!dateRange?.from || !dateRange?.to) {
        console.log('No date range set, skipping fetch');
        return;
      }
      
      console.log('Starting to fetch error logs...', {
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        },
        selectedAgentId,
        apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ? 'Present' : 'Missing'
      });
      
      setLoading(true);
      setError(null);
      
      try {
        const startUnix = Math.floor(dateRange.from.getTime() / 1000);
        const endUnix = Math.floor(dateRange.to.getTime() / 1000);
        
        console.log('Date range in Unix:', { startUnix, endUnix });
        
        let conversationsData: Conversation[] = [];
        
        if (selectedAgentId === "all") {
          console.log('Fetching conversations for all agents...');
          
          // First, try to fetch conversations without date filters to see if we get any data
          console.log('Testing API with no date filters...');
          try {
            const testResp = await elevenLabsApi.listConversations({
              page_size: 10,
              summary_mode: "include",
            });
            console.log('Test API response status:', testResp.status);
            if (testResp.ok) {
              const testJson = await testResp.json();
              console.log('Test API response data:', testJson);
              console.log('Test conversations count:', testJson.conversations?.length || 0);
            } else {
              const errorText = await testResp.text();
              console.error('Test API error:', errorText);
            }
          } catch (testError) {
            console.error('Test API call failed:', testError);
          }
          
          // Fetch all conversations with pagination
          let cursor: string | undefined = undefined;
          let loops = 0;
          
          do {
            const params: any = {
              call_start_after_unix: startUnix,
              call_start_before_unix: endUnix,
              page_size: 100,
              summary_mode: "include",
            };
            if (cursor) params.cursor = cursor;
            
            console.log('Fetching conversations with params:', params);
            
            try {
              const resp = await elevenLabsApi.listConversations(params);
              console.log('ElevenLabs API response status:', resp.status);
              
              if (!resp.ok) {
                console.error('ElevenLabs API error:', resp.status, resp.statusText);
                const errorText = await resp.text();
                console.error('Error response:', errorText);
                break;
              }
              
              const json = await resp.json();
              console.log('ElevenLabs API response data:', json);
              
              const list = Array.isArray(json.conversations) ? json.conversations : [];
              console.log('Processed conversations list:', list.length, 'conversations');
              
              conversationsData.push(...list);
              cursor = json.next_cursor || json.cursor || undefined;
              loops += 1;
              
              console.log('Pagination info:', { cursor, loops, totalConversations: conversationsData.length });
            } catch (err) {
              console.error('Error fetching paginated conversations:', err);
              break;
            }
          } while (cursor && loops < 100);
        } else {
          // Fetch conversations for selected agent only
          try {
            const conversationsRes = await elevenLabsApi.listConversations({
              agent_id: selectedAgentId,
              call_start_after_unix: startUnix,
              call_start_before_unix: endUnix,
              page_size: 100,
              summary_mode: "include"
            });
            if (conversationsRes.ok) {
              const conversationsJson = await conversationsRes.json();
              conversationsData = conversationsJson.conversations || [];
            }
          } catch (error) {
            console.error("Error fetching conversations for agent:", error);
          }
        }
        
        // Fetch usage stats for the date range
        try {
          const usageRes = await elevenLabsApi.getUsageStats({
            start_unix: startUnix,
            end_unix: endUnix
          });
          if (usageRes.ok) {
            const usageData = await usageRes.json();
            setUsageStats(usageData);
          }
        } catch (error) {
          console.error("Error fetching usage stats:", error);
        }

        console.log('Total conversations fetched:', conversationsData.length);
        console.log('Sample conversation data:', conversationsData.slice(0, 3));
        
        // Include ALL calls (failed, unknown status, and potentially problematic successful calls)
        // For debugging, let's also include some successful calls to see if we have any data at all
        const allConversations = conversationsData.filter(conv => 
          !conv.call_successful || 
          conv.call_successful === undefined || 
          conv.call_successful === null ||
          (conv.call_successful && conv.call_duration_seconds && conv.call_duration_seconds < 3) ||
          // Temporarily include all calls for debugging
          true
        );
        
        console.log('Filtered conversations for error logs:', allConversations.length);
        console.log('Sample filtered conversation:', allConversations.slice(0, 2));
        
        // Fetch detailed conversation data for all relevant calls to get full error information
        const detailedConversations = await Promise.all(
          allConversations.map(async (conv) => {
            try {
              const detailResponse = await elevenLabsApi.getConversationDetails(conv.conversation_id);
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                return {
                  ...conv,
                  ...detailData,
                  // Merge error information from detailed response
                  error_message: detailData.error_message || conv.error_message,
                  error_code: detailData.error_code || conv.error_code,
                  failure_reason: detailData.failure_reason || detailData.error_message,
                  call_status: detailData.call_status || 'Failed'
                };
              }
            } catch (error) {
              console.error(`Error fetching details for conversation ${conv.conversation_id}:`, error);
            }
            return conv;
          })
        );
        
        console.log('Processing detailed conversations:', detailedConversations.length);
        console.log('Sample detailed conversation:', detailedConversations[0]);
        const errorLogsData: ErrorLogEntry[] = detailedConversations.map((conv, index) => {
          const agent = agents.find(a => a.agent_id === conv.agent_id);
          const errorInfo = categorizeError(conv);
          
          // Get the most comprehensive error message available
          const fullErrorMessage = conv.failure_reason || 
                                 conv.error_message || 
                                 conv.summary?.error_reason || 
                                 conv.summary?.error_details || 
                                 errorInfo.description;
          
          // Find the actual client name from the clients data
          const client = clients.find(c => c.id == agent?.client_id);
          const clientName = client?.companyName || (agent?.client_id ? `Client ${agent.client_id}` : 'Unknown Client');
          
          return {
            id: `err_${conv.conversation_id}`,
            callId: conv.conversation_id.substring(0, 12),
            conversationId: conv.conversation_id,
            clientName: clientName,
            clientId: agent?.client_id?.toString() || 'unknown',
            campaignName: agent?.name || 'Unknown Campaign',
            campaignId: conv.agent_id,
            agentId: conv.agent_id,
            agentName: agent?.name || 'Unknown Agent',
            timestamp: (() => {
              try {
                // Try different possible timestamp field names from ElevenLabs API
                const timestampFields = [
                  'call_start_unix',
                  'created_unix', 
                  'start_time_unix',
                  'timestamp_unix',
                  'created_at_unix',
                  'started_at_unix'
                ];
                
                let unixTimestamp: number | null = null;
                let fieldName = '';
                
                for (const field of timestampFields) {
                  if (conv[field] && typeof conv[field] === 'number') {
                    unixTimestamp = conv[field];
                    fieldName = field;
                    break;
                  }
                }
                
                if (unixTimestamp) {
                  const date = new Date(unixTimestamp * 1000);
                  if (isNaN(date.getTime())) {
                    console.warn('Invalid timestamp from Unix:', unixTimestamp, 'field:', fieldName);
                    return new Date(); // Fallback to current time
                  }
                  console.log('Created timestamp for conversation', conv.conversation_id, ':', date.toISOString(), 'from field:', fieldName, 'value:', unixTimestamp);
                  return date;
                } else {
                  console.warn('No valid timestamp field found for conversation:', conv.conversation_id, 'Available fields:', Object.keys(conv));
                  return new Date(); // Fallback to current time
                }
              } catch (error) {
                console.error('Error creating timestamp:', error, 'for conversation:', conv.conversation_id);
                return new Date(); // Fallback to current time
              }
            })(),
            errorType: errorInfo.type,
            errorDescription: errorInfo.description,
            isResolved: "No" as ResolvedStatus,
            callDuration: conv.call_duration_seconds,
            phoneNumber: conv.phone_number,
            callStatus: conv.call_status || (conv.call_successful ? 'Success' : 'Failed'),
            errorCode: errorInfo.errorCode || conv.error_code,
            stackTrace: conv.summary?.error_details,
            sipStatus: errorInfo.sipStatus,
            fullErrorMessage: fullErrorMessage
          };
        });
        
        console.log('Error logs data created:', errorLogsData.length);
        console.log('Sample error log entry:', errorLogsData[0]);
        
        // Filter out any invalid entries
        const validErrorLogs = errorLogsData.filter(log => log && log.id && log.timestamp);
        console.log('Valid error logs after filtering:', validErrorLogs.length);
        
        setErrorLogs(validErrorLogs);
        
        if (validErrorLogs.length === 0) {
          toast({
            title: "No Data Found",
            description: `No error logs found for the selected criteria. Date range: ${dateRange.from?.toDateString()} to ${dateRange.to?.toDateString()}`,
            variant: "default"
          });
        } else {
          toast({
            title: "Data Loaded",
            description: `Found ${errorLogsData.length} error logs`,
            variant: "default"
          });
        }
      } catch (error) {
        console.error('Error fetching error logs:', error);
        setError('Failed to fetch error logs');
        toast({
          title: "Error",
          description: "Failed to fetch error logs from ElevenLabs",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchErrorLogs();
  }, [dateRange, selectedAgentId, agents, toast]);

  const filteredErrorLogs = React.useMemo(() => {
    const filtered = errorLogs.filter(log => {
      // Date range filtering - check if log timestamp is within the selected range
      const dateMatch = dateRange?.from && dateRange?.to ? 
        log.timestamp >= dateRange.from && log.timestamp <= addDays(dateRange.to, 1) : true;
      
      // Agent filtering - match specific agent or show all
      const agentMatch = selectedAgentId === "all" || log.agentId === selectedAgentId;
      
      // Error type filtering - match specific error type or show all
      const errorTypeMatch = selectedErrorType === "all" || log.errorType === selectedErrorType;
      
      return dateMatch && agentMatch && errorTypeMatch;
    });
    
    return filtered;
  }, [errorLogs, dateRange, selectedAgentId, selectedErrorType]);

  const totalPages = Math.ceil(filteredErrorLogs.length / itemsPerPage);
  const paginatedErrorLogs = filteredErrorLogs
    .filter(log => log && log.id) // Remove any invalid entries
    .slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  
  // Debug pagination
  console.log('Pagination Debug:', {
    totalErrorLogs: errorLogs.length,
    filteredErrorLogs: filteredErrorLogs.length,
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedCount: paginatedErrorLogs.length,
    startIndex: (currentPage - 1) * itemsPerPage,
    endIndex: currentPage * itemsPerPage,
    paginatedIds: paginatedErrorLogs.map(log => log.id)
  });
  

  const handleApplyFilters = () => {
    setCurrentPage(1);
    toast({ title: "Filters Applied", description: "Error log data has been updated." });
  };

  const handleResetFilters = () => {
    setDateRange({ from: subDays(new Date(), 7), to: new Date() });
    setSelectedAgentId("all");
    setSelectedErrorType("all");
    setCurrentPage(1);
    toast({ title: "Filters Reset", description: "Error log filters have been reset." });
  };

  const handleExport = (format: "CSV" | "Excel" | "PDF") => {
    toast({ 
        title: "Export Initiated (Simulated)", 
        description: `Preparing error logs report as ${format}.`,
    });
    console.log(`Simulating export of error logs as ${format}. Data:`, filteredErrorLogs);
  };
  
  const handleMarkResolved = (logId: string) => {
    setErrorLogs(prev => prev.map(log => {
      if (log.id === logId) {
        const newStatus = log.isResolved === "Yes" ? "No" : "Yes";
        return {...log, isResolved: newStatus};
      }
      return log;
    }));
    
    const log = errorLogs.find(l => l.id === logId);
    const newStatus = log?.isResolved === "Yes" ? "No" : "Yes";
    toast({ 
      title: "Status Updated", 
      description: `Error log marked as ${newStatus === "Yes" ? "resolved" : "unresolved"}.`
    });
  };


  const failureRate = React.useMemo(() => {
    if (filteredErrorLogs.length === 0) return "0%";
    
    // Try to get total calls from usage stats, fallback to error logs count
    const totalCalls = usageStats?.total_calls || filteredErrorLogs.length;
    const criticalErrors = filteredErrorLogs.filter(log => log.errorType !== "No Answer").length;
    
    return totalCalls > 0 ? (criticalErrors / totalCalls * 100).toFixed(1) + "%" : "0%";
  }, [filteredErrorLogs, usageStats]);
  const commonErrorType = filteredErrorLogs.length > 0 ? 
    Object.entries(filteredErrorLogs.reduce((acc, log) => { acc[log.errorType] = (acc[log.errorType] || 0) + 1; return acc; }, {} as Record<ErrorType, number>))
        .sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A" 
    : "N/A";
  const affectedAgentsCount = new Set(filteredErrorLogs.map(log => log.agentId)).size;


  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <ShieldAlert className="mr-3 h-8 w-8 text-destructive" /> Call Reports & Error Logs
          </h1>
          <p className="text-muted-foreground">
            View all call reports including failed calls, unknown status calls, and issues. Error messages are shown in simple language.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" /> Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport("CSV")}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("Excel")}>Export as Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("PDF")}>Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ListFilter className="mr-2 h-5 w-5"/>Filter Error Logs</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Date Range</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date-error" variant={"outline"} className={cn("w-full justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Pick a date range</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Agent</span>
             <Popover open={agentOpen} onOpenChange={setAgentOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between h-9" disabled={agentsLoading}>
                  <Users className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                  {agentsLoading ? "Loading agents..." : selectedAgentId === "all" ? "All Agents" : agents.find(agent => agent.agent_id === selectedAgentId)?.name || "Select Agent"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command>
                  <CommandInput placeholder="Search agent..." /><CommandList><CommandEmpty>No agent found.</CommandEmpty><CommandGroup>
                  <CommandItem value="all" onSelect={() => {setSelectedAgentId("all"); setAgentOpen(false);}}>
                    <Check className={cn("mr-2 h-4 w-4", selectedAgentId === "all" ? "opacity-100" : "opacity-0")}/>
                    All Agents
                  </CommandItem>
                  {agentsLoading ? (
                    <CommandItem disabled>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="text-muted-foreground">Loading agents...</span>
                    </CommandItem>
                  ) : agents.length > 0 ? agents.map(agent => (
                    <CommandItem key={agent.agent_id} value={agent.name} onSelect={() => {setSelectedAgentId(agent.agent_id); setAgentOpen(false);}}>
                      <Check className={cn("mr-2 h-4 w-4", selectedAgentId === agent.agent_id ? "opacity-100" : "opacity-0")}/>
                      {agent.name}
                    </CommandItem>
                  )) : (
                    <CommandItem disabled>
                      <span className="text-muted-foreground">No agents found</span>
                    </CommandItem>
                  )}
              </CommandGroup></CommandList></Command></PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col space-y-1.5">
            <span className="text-sm font-medium">Error Type</span>
            <Select value={selectedErrorType} onValueChange={(value) => setSelectedErrorType(value as ErrorType | "all")}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Error Types</SelectItem>
                    {errorTypeOptions.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} className="w-full h-9" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply
            </Button>
            <Button onClick={handleResetFilters} variant="outline" className="w-full h-9"><FilterX className="mr-2 h-4 w-4"/> Reset</Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center"><AlertTriangle className="mr-2 h-4 w-4 text-red-500"/>Issue Rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{failureRate}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center"><Zap className="mr-2 h-4 w-4 text-orange-500"/>Most Common Issue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold truncate" title={commonErrorType}>{commonErrorType}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center"><Users className="mr-2 h-4 w-4 text-blue-500"/>Affected Agents</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{affectedAgentsCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center"><RefreshCw className="mr-2 h-4 w-4 text-green-500"/>Total Reports</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{filteredErrorLogs.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call Reports & Error Details</CardTitle>
          <CardDescription>List of all call reports including failed calls, unknown status calls, and issues. Error messages are displayed in simple, easy-to-understand language.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call ID</TableHead>
                  <TableHead>Agent / Client</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead className="min-w-[200px]">What Happened</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Resolved</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading error logs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : paginatedErrorLogs.length > 0 ? paginatedErrorLogs.map((log, index) => {
                  // Add error boundary for each row
                  try {
                    // Ensure we have valid data for this row
                    if (!log || !log.id) {
                      console.warn('Invalid log entry at index:', index, log);
                      return null;
                    }
                    
                    return (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.callId}</TableCell>
                    <TableCell>
                        <div className="font-medium">{log.agentName}</div>
                        <div className="text-xs text-muted-foreground">{log.clientName}</div>
                        {log.phoneNumber && <div className="text-xs text-muted-foreground">{log.phoneNumber}</div>}
                    </TableCell>
                    <TableCell>
                      {log.timestamp && !isNaN(new Date(log.timestamp).getTime()) 
                        ? format(new Date(log.timestamp), "MMM dd, HH:mm:ss")
                        : 'Invalid Date'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="text-xs">
                        {log.errorType}
                      </Badge>
                      {log.sipStatus && (
                        <div className="text-xs text-muted-foreground mt-1">
                          SIP: {log.sipStatus}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs max-w-sm">
                      <div className="space-y-1">
                        <div className="font-medium text-foreground" title={log.fullErrorMessage}>
                          {log.errorDescription}
                        </div>
                        {log.fullErrorMessage && log.fullErrorMessage !== log.errorDescription && (
                          <div className="text-muted-foreground text-xs truncate" title={log.fullErrorMessage}>
                            Technical: {log.fullErrorMessage}
                          </div>
                        )}
                        {log.errorCode && (
                          <div className="text-muted-foreground font-mono text-xs">
                            Error Code: {log.errorCode}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.callDuration ? `${log.callDuration}s` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.callStatus === 'Failed' ? 'destructive' : 'secondary'} className="text-xs">
                        {log.callStatus}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge className={cn("text-xs", resolvedStatusColors[log.isResolved])}>{log.isResolved}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleMarkResolved(log.id)} disabled={log.isResolved === "Yes"}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500"/>Mark Resolved
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleMarkResolved(log.id)} disabled={log.isResolved === "No" || log.isResolved === "Investigating"}>
                                <XCircle className="mr-2 h-4 w-4 text-red-500"/>Mark Unresolved
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                    );
                  } catch (rowError) {
                    console.error(`Error rendering row ${index}:`, rowError, 'Log data:', log);
                    return (
                      <TableRow key={log.id || `error-${index}`}>
                        <TableCell colSpan={9} className="text-center text-destructive">
                          Error rendering row: {String(rowError)}
                        </TableCell>
                      </TableRow>
                    );
                  }
                }) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No error logs found for the selected criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
           <div className="text-xs text-muted-foreground">
             Showing <strong>{paginatedErrorLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong>
             - <strong>{Math.min(currentPage * itemsPerPage, filteredErrorLogs.length)}</strong> of <strong>{filteredErrorLogs.length}</strong> logs
           </div>
           <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
           </div>
        </CardFooter>
      </Card>
    </div>
  );
}
