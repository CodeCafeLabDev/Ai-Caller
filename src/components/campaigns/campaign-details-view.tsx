"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Calendar, 
  Phone, 
  User, 
  Users,
  Building, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  X,
  RotateCcw
} from "lucide-react";
import { format } from "date-fns";
import { urls } from '@/lib/config/urls';
import { cn } from "@/lib/cn";

interface CampaignDetailsViewProps {
  campaignId: string;
  onClose: () => void;
}

interface CampaignDetails {
  // ElevenLabs data
  elevenlabs: {
    id: string;
    name: string;
    agent_id: string;
    agent_name: string;
    phone_provider: string;
    status: string;
    total_calls_scheduled: number;
    total_calls_dispatched: number;
    created_at_unix: number;
    last_updated_at_unix: number;
    scheduled_time_unix?: number;
  };
  // Local database data (for client name and campaign type)
  local: {
    clientName?: string;
    type?: string;
  } | null;
  // Recipients data
  recipients: {
    id?: string;
    phone_number?: string;
    phone?: string;
    number?: string;
    e164?: string;
    language?: string;
    lang?: string;
    voice_id?: string;
    first_message?: string;
    prompt?: string;
    city?: string;
    location?: string;
    other_dyn_variable?: string;
    name?: string;
    contact_name?: string;
    status?: string;
    call_status?: string;
    call_duration?: number;
    duration?: number;
    length?: number;
    transcription?: string;
    created_at_unix?: number;
    updated_at_unix?: number;
    conversation_id?: string;
    conversation_initiation_client_data?: {
      conversation_config_override?: {
        tts?: any;
        conversation?: any;
        agent?: {
          first_message?: string;
          language?: string;
          prompt?: string;
        };
      };
      custom_llm_extra_body?: any;
      user_id?: string;
      source_info?: any;
      dynamic_variables?: {
        city?: string;
        name?: string;
        [key: string]: any;
      };
    };
  }[];
}

export function CampaignDetailsView({ campaignId, onClose }: CampaignDetailsViewProps) {
  const [details, setDetails] = React.useState<CampaignDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const fetchCampaignDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from ElevenLabs
      const elevenlabsRes = await fetch(`${urls.backend.campaigns.details(campaignId)}`);
      const elevenlabsData = await elevenlabsRes.json();

      // Fetch from local database (for client name and campaign type)
      console.log('Fetching local data from:', urls.backend.campaigns.localDetails(campaignId));
      const localRes = await fetch(`${urls.backend.campaigns.localDetails(campaignId)}`);
      const localData = await localRes.json();
      
      console.log('Local data response status:', localRes.status);
      console.log('Local data received:', localData);

      // Fetch recipients from ElevenLabs
      console.log('Fetching recipients from:', urls.backend.campaigns.recipients(campaignId));
      const recipientsRes = await fetch(`${urls.backend.campaigns.recipients(campaignId)}`);
      const recipientsData = await recipientsRes.json();

      console.log('Recipients response status:', recipientsRes.status);
      console.log('Recipients data received:', recipientsData);

      // Handle different possible recipients data structures
      let recipients = [];
      if (Array.isArray(recipientsData)) {
        recipients = recipientsData;
        console.log('Recipients found as direct array:', recipients.length);
      } else if (recipientsData && Array.isArray(recipientsData.recipients)) {
        recipients = recipientsData.recipients;
        console.log('Recipients found in data.recipients:', recipients.length);
      } else if (recipientsData && Array.isArray(recipientsData.calls)) {
        recipients = recipientsData.calls;
        console.log('Recipients found in data.calls:', recipients.length);
      } else if (recipientsData && Array.isArray(recipientsData.call_recipients)) {
        recipients = recipientsData.call_recipients;
        console.log('Recipients found in data.call_recipients:', recipients.length);
      } else {
        console.log('No recipients found in expected structures. Available keys:', Object.keys(recipientsData || {}));
      }

      console.log('Final processed recipients:', recipients);

      setDetails({
        elevenlabs: elevenlabsData,
        local: localData.success ? { 
          clientName: localData.data?.clientName, 
          type: localData.data?.type 
        } : null,
        recipients: recipients
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaign details');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  React.useEffect(() => {
    fetchCampaignDetails();
  }, [fetchCampaignDetails]);

  const handleCancelCampaign = async () => {
    if (!details?.elevenlabs?.id) return;
    
    setActionLoading('cancel');
    try {
      const response = await fetch(urls.backend.campaigns.cancel(details.elevenlabs.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh the campaign details to get updated status
        await fetchCampaignDetails();
        console.log('Campaign cancelled successfully');
      } else {
        console.error('Failed to cancel campaign:', result.error);
      }
    } catch (error) {
      console.error('Error cancelling campaign:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryCampaign = async () => {
    if (!details?.elevenlabs?.id) return;
    
    setActionLoading('retry');
    try {
      const response = await fetch(urls.backend.campaigns.retry(details.elevenlabs.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh the campaign details to get updated status
        await fetchCampaignDetails();
        console.log('Campaign retry initiated successfully');
      } else {
        console.error('Failed to retry campaign:', result.error);
      }
    } catch (error) {
      console.error('Error retrying campaign:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (statusLower.includes('fail')) return <XCircle className="h-4 w-4 text-red-600" />;
    if (statusLower.includes('pending')) return <Clock className="h-4 w-4 text-yellow-600" />;
    if (statusLower.includes('progress')) return <RefreshCw className="h-4 w-4 text-blue-600" />;
    return <AlertCircle className="h-4 w-4 text-gray-600" />;
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete')) return "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100";
    if (statusLower.includes('fail')) return "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100";
    if (statusLower.includes('pending')) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100";
    if (statusLower.includes('progress')) return "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100";
    return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading campaign details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <XCircle className="h-8 w-8 text-red-600 mb-2" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchCampaignDetails} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No campaign details found</p>
      </div>
    );
  }

  const { elevenlabs, local, recipients } = details;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold">Campaign Details</h2>
          <p className="text-muted-foreground">View comprehensive campaign information</p>
        </div>
        <Button onClick={onClose} variant="outline" size="sm">
          Close
        </Button>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {/* Campaign Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Campaign Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Campaign Name</label>
                  <p className="text-lg font-semibold">{elevenlabs.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(elevenlabs.status)}
                    <Badge className={cn("text-xs", getStatusColor(elevenlabs.status))}>
                      {elevenlabs.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Client Name</label>
                  <p className="font-semibold">{local?.clientName || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Campaign Type</label>
                  <Badge variant="secondary">{local?.type || 'Outbound'}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Calls Scheduled</label>
                  <p className="text-2xl font-bold text-blue-600">{elevenlabs.total_calls_scheduled}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Calls Dispatched</label>
                  <p className="text-2xl font-bold text-green-600">{elevenlabs.total_calls_dispatched}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Success Rate</label>
                  <p className="text-2xl font-bold text-purple-600">
                    {elevenlabs.total_calls_scheduled > 0 
                      ? Math.round((elevenlabs.total_calls_dispatched / elevenlabs.total_calls_scheduled) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agent Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Agent Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Agent ID</label>
                  <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{elevenlabs.agent_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Agent Name</label>
                  <p className="font-semibold">{elevenlabs.agent_name}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone Provider</label>
                <p className="font-semibold capitalize">{elevenlabs.phone_provider || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Recipients Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Call Recipients ({recipients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recipients.length > 0 ? (() => {
                // Analyze recipients to determine which columns have data
                const sampleRecipient = recipients[0];
                const dynamicVars = sampleRecipient?.conversation_initiation_client_data?.dynamic_variables || {};
                
                const hasPhone = recipients.some(r => r.phone_number);
                const hasStatus = recipients.some(r => r.status);
                const hasLanguage = recipients.some(r => r.conversation_initiation_client_data?.conversation_config_override?.agent?.language);
                const hasCity = recipients.some(r => r.conversation_initiation_client_data?.dynamic_variables?.city);
                const hasName = recipients.some(r => r.conversation_initiation_client_data?.dynamic_variables?.name);
                const hasDuration = recipients.some(r => r.created_at_unix && r.updated_at_unix);
                
                // Build dynamic columns
                const columns: { key: string; label: string }[] = [];
                if (hasPhone) columns.push({ key: 'phone', label: 'Phone' });
                if (hasStatus) columns.push({ key: 'status', label: 'Status' });
                if (hasLanguage) columns.push({ key: 'language', label: 'Language' });
                if (hasCity) columns.push({ key: 'city', label: 'City' });
                if (hasName) columns.push({ key: 'name', label: 'Name' });
                if (hasDuration) columns.push({ key: 'duration', label: 'Duration' });
                
                return (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columns.map(col => (
                            <TableHead key={col.key}>{col.label}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recipients.map((recipient, index) => {
                          // Extract data from the nested ElevenLabs structure
                          const phoneNumber = recipient.phone_number || '-';
                          const status = recipient.status || 'pending';
                          
                          // Extract dynamic variables from nested structure
                          const dynamicVars = recipient.conversation_initiation_client_data?.dynamic_variables || {};
                          const city = dynamicVars.city || '-';
                          const name = dynamicVars.name || '-';
                          
                          // Extract language from nested structure
                          const language = recipient.conversation_initiation_client_data?.conversation_config_override?.agent?.language || 'en';
                          
                          // Calculate duration if available
                          const createdTime = recipient.created_at_unix;
                          const updatedTime = recipient.updated_at_unix;
                          const duration = createdTime && updatedTime ? Math.round(updatedTime - createdTime) : null;
                          
                          return (
                            <TableRow key={index}>
                              {columns.map(col => {
                                let content;
                                switch (col.key) {
                                  case 'phone':
                                    content = <span className="font-mono text-sm">{phoneNumber}</span>;
                                    break;
                                  case 'status':
                                    content = (
                                      <div className="flex items-center gap-2">
                                        {getStatusIcon(status)}
                                        <Badge className={cn("text-xs", getStatusColor(status))}>
                                          {status}
                                        </Badge>
                                      </div>
                                    );
                                    break;
                                  case 'language':
                                    content = (
                                      <Badge variant="outline" className="text-xs">
                                        {language}
                                      </Badge>
                                    );
                                    break;
                                  case 'city':
                                    content = <span>{city}</span>;
                                    break;
                                  case 'name':
                                    content = <span>{name}</span>;
                                    break;
                                  case 'duration':
                                    content = <span>{duration ? `${duration}s` : '-'}</span>;
                                    break;
                                  default:
                                    content = <span>-</span>;
                                }
                                return <TableCell key={col.key}>{content}</TableCell>;
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })() : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recipients found for this campaign</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{format(new Date(elevenlabs.created_at_unix * 1000), "PPpp")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">{format(new Date(elevenlabs.last_updated_at_unix * 1000), "PPpp")}</p>
                </div>
              </div>
              
              {elevenlabs.scheduled_time_unix && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Scheduled Time</label>
                  <p className="text-sm">{format(new Date(elevenlabs.scheduled_time_unix * 1000), "PPpp")}</p>
                </div>
              )}
            </CardContent>
          </Card>


          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={fetchCampaignDetails}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
                
                {/* Cancel button - show for active campaigns */}
                {elevenlabs.status === 'in_progress' && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleCancelCampaign}
                    disabled={actionLoading === 'cancel'}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Campaign'}
                  </Button>
                )}
                
                {/* Retry button - show for failed or cancelled campaigns */}
                {(elevenlabs.status === 'failed' || elevenlabs.status === 'cancelled') && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleRetryCampaign}
                    disabled={actionLoading === 'retry'}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {actionLoading === 'retry' ? 'Retrying...' : 'Retry Campaign'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
