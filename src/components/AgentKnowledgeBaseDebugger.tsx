'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AgentKnowledgeBaseDebuggerProps {
  agentId: string;
}

export default function AgentKnowledgeBaseDebugger({ agentId }: AgentKnowledgeBaseDebuggerProps) {
  const [agentData, setAgentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentData = async () => {
    setLoading(true);
    setError(null);
    
    console.log(`[Debugger] Fetching agent data for agent ID: ${agentId}`, {
      agentId,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        headers: {
          'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json',
        },
      });

      console.log(`[Debugger] Agent API response status:`, {
        agentId,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log(`[Debugger] Agent data received:`, {
        agentId,
        agentData: data,
        knowledgeBase: data?.conversation_config?.agent?.prompt?.knowledge_base,
        timestamp: new Date().toISOString()
      });

      setAgentData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      console.error(`[Debugger] Error fetching agent data:`, {
        agentId,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchAgentData();
    }
  }, [agentId]);

  const knowledgeBase = agentData?.conversation_config?.agent?.prompt?.knowledge_base || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Agent Knowledge Base Debugger
          <Badge variant={loading ? "secondary" : error ? "destructive" : "default"}>
            {loading ? "Loading..." : error ? "Error" : "Ready"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Debug information for agent {agentId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={fetchAgentData} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            Refresh Data
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        {agentData && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Agent Information</h4>
              <div className="text-sm space-y-1">
                <div><strong>Agent ID:</strong> {agentData.agent_id}</div>
                <div><strong>Name:</strong> {agentData.name || 'N/A'}</div>
                <div><strong>Language:</strong> {agentData.conversation_config?.agent?.language || 'N/A'}</div>
                <div><strong>LLM:</strong> {agentData.conversation_config?.agent?.prompt?.llm || 'N/A'}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Knowledge Base Items ({knowledgeBase.length})</h4>
              {knowledgeBase.length > 0 ? (
                <div className="space-y-2">
                  {knowledgeBase.map((item: any, index: number) => (
                    <div key={index} className="p-3 border rounded bg-gray-50">
                      <div className="text-sm space-y-1">
                        <div><strong>ID:</strong> {item.id}</div>
                        <div><strong>Name:</strong> {item.name}</div>
                        <div><strong>Type:</strong> {item.type}</div>
                        <div><strong>Usage Mode:</strong> {item.usage_mode || 'auto'}</div>
                        {item.url && <div><strong>URL:</strong> {item.url}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No knowledge base items found</div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-2">Raw Knowledge Base Data</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(knowledgeBase, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 