import { useState, useCallback } from 'react';

const API_BASE = 'https://api.elevenlabs.io/v1/convai/tools';

export default function useElevenLabsTools(apiKey: string) {
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper for headers
  const headers = {
    'Content-Type': 'application/json',
    'xi-api-key': apiKey,
  };

  // Fetch all tools
  const fetchTools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE, { headers });
      if (!res.ok) throw new Error('Failed to fetch tools');
      const data = await res.json();
      setTools(data.tools || data || []);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  // Fetch a single tool
  const fetchTool = useCallback(async (toolId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${toolId}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch tool');
      return await res.json();
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  // Create a tool
  const createTool = useCallback(async (tool: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify(tool),
      });
      if (!res.ok) throw new Error('Failed to create tool');
      const newTool = await res.json();
      setTools(prev => [...prev, newTool]);
      return newTool;
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  // Update a tool
  const updateTool = useCallback(async (toolId: string, updates: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${toolId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update tool');
      const updatedTool = await res.json();
      setTools(prev => prev.map(t => t.id === toolId ? updatedTool : t));
      return updatedTool;
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  // Delete a tool
  const deleteTool = useCallback(async (toolId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${toolId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete tool');
      setTools(prev => prev.filter(t => t.id !== toolId));
      return true;
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  return {
    tools,
    loading,
    error,
    fetchTools,
    fetchTool,
    createTool,
    updateTool,
    deleteTool,
    setTools, // for manual updates if needed
  };
} 