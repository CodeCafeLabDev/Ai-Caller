import React, { useState, useEffect } from 'react';
import IntegrationCard from './integration-card'; // Import the IntegrationCard component
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/apiConfig';

const ELEVEN_LABS_ID = 'elevenlabs';
const ELEVEN_LABS_API_KEY_STORAGE = 'elevenlabs_api_key';

const Integrations = () => {
  const [integrations, setIntegrations] = useState([
    { id: 'hubspot', name: 'HubSpot CRM', status: 'Connected' },
    { id: 'zoho', name: 'Zoho CRM', status: 'Not Connected' },
    { id: 'salesforce', name: 'Salesforce CRM', status: 'Connected' },
    { id: 'whatsapp', name: 'WhatsApp Cloud API', status: 'Not Connected' },
    { id: 'twilio', name: 'Twilio', status: 'Connected' },
    { id: 'webhooks', name: 'Webhooks', status: 'Connected' },
    { id: ELEVEN_LABS_ID, name: 'Eleven Labs', status: 'Not Connected' },
  ]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [modals, setModals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelOptions, setModelOptions] = useState<{model_id: string, name: string}[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [voices, setVoices] = useState<{voice_id: string, name: string}[]>([]);

  // On mount, load API key from localStorage
  useEffect(() => {
    const storedKey = typeof window !== 'undefined' ? localStorage.getItem(ELEVEN_LABS_API_KEY_STORAGE) : '';
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleConfigure = (integrationId: string) => {
    if (integrationId === ELEVEN_LABS_ID) {
      setSheetOpen(true);
      setError(null);
      setModelOptions([]);
      setSelectedModel('');
    } else {
      alert('Configuration for this integration is not implemented yet.');
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ELEVEN_LABS_API_KEY_STORAGE, e.target.value);
    }
  };

  const handleFetchModels = async () => {
    setError(null);
    setModelOptions([]);
    setSelectedModel('');
    setSubscriptionInfo(null);
    setUserInfo(null);
    setVoices([]);
    if (apiKey) {
      setLoading(true);
      try {
        const response = await api.elevenLabs.getModels(apiKey);
        if (!response.ok) {
          throw new Error('Invalid API key or failed to fetch models.');
        }
        const data = await response.json();
        const models = Array.isArray(data) ? data : data.models;
        setModelOptions(Array.isArray(models) ? models.map((m: any) => ({ model_id: m.model_id, name: m.name })) : []);
        setIntegrations((prev) =>
          prev.map((i) =>
            i.id === ELEVEN_LABS_ID ? { ...i, status: 'Connected' } : i
          )
        );
        // Fetch subscription info
        const subRes = await api.elevenLabs.getUserSubscription(apiKey);
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscriptionInfo(subData);
        }
        // Fetch user info
        const userRes = await api.elevenLabs.getUser(apiKey);
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserInfo(userData);
        }
        // Fetch voices
        const voicesRes = await api.elevenLabs.getVoices(apiKey);
        if (voicesRes.ok) {
          const voicesData = await voicesRes.json();
          setVoices(Array.isArray(voicesData.voices) ? voicesData.voices.map((v: any) => ({ voice_id: v.voice_id, name: v.name })) : []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch models.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Integrations</h2>
      <p className="text-muted-foreground">Manage third-party integrations and API settings.</p>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) =>
            integration.id === ELEVEN_LABS_ID ? (
              <SheetTrigger asChild key={integration.id}>
                <div>
                  <IntegrationCard
                    name={integration.name}
                    status={integration.status as 'Connected' | 'Not Connected'}
                    onConfigure={() => handleConfigure(integration.id)}
                    switchChecked={integration.status === 'Connected'}
                    onSwitchChange={(checked) => {
                      if (!checked) {
                        setIntegrations((prev) =>
                          prev.map((i) =>
                            i.id === ELEVEN_LABS_ID ? { ...i, status: 'Not Connected' } : i
                          )
                        );
                        setApiKey('');
                        setModals([]);
                      } else {
                        if (integration.status !== 'Connected') setSheetOpen(true);
                      }
                    }}
                  />
                </div>
              </SheetTrigger>
            ) : (
              <IntegrationCard
                key={integration.id}
                name={integration.name}
                status={integration.status as 'Connected' | 'Not Connected'}
                onConfigure={() => handleConfigure(integration.id)}
              />
            )
          )}
        </div>
        <SheetContent side="right" className="max-w-md w-full">
          <SheetHeader>
            <SheetTitle>Configure Eleven Labs</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-4 h-full">
            <div className="sticky top-0 z-10 bg-card pb-2">
              <label className="font-medium">API Key</label>
              <Input
                type="text"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter your Eleven Labs API key"
                className="mb-2"
              />
              <Button onClick={handleFetchModels} disabled={loading || !apiKey} className="w-full">
                {loading ? 'Configuring...' : 'Configure'}
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
              {!loading && !error && modelOptions.length > 0 && (
                <>
                  <div className="mt-4">
                    <label className="font-medium mb-1 block">Select Model</label>
                    <select
                      className="w-full border rounded p-2"
                      value={selectedModel}
                      onChange={e => setSelectedModel(e.target.value)}
                    >
                      <option value="" disabled>Select a model</option>
                      {modelOptions.map((model) => (
                        <option key={model.model_id} value={model.model_id}>{model.name}</option>
                      ))}
                    </select>
                  </div>
                  {subscriptionInfo && (
                    <div className="mt-4 p-4 rounded border bg-muted text-sm">
                      <div className="font-semibold mb-2">User Subscription Info</div>
                      <div>
                        {Object.entries(subscriptionInfo).map(([key, value]) => (
                          <div key={key} className="mb-1">
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {userInfo && (
                    <div className="mt-4 p-4 rounded border bg-muted text-sm">
                      <div className="font-semibold mb-2">User Info</div>
                      <div>
                        {Object.entries(userInfo).map(([key, value]) => (
                          <div key={key} className="mb-1">
                            <span className="font-medium">{key}:</span> {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {voices.length > 0 && (
                    <div className="mt-4 p-4 rounded border bg-muted text-sm">
                      <div className="font-semibold mb-2">Voices</div>
                      <ul className="list-disc pl-5">
                        {voices.map((voice) => (
                          <li key={voice.voice_id} className="mb-2">
                            <div><span className="font-medium">voice id:</span> {voice.voice_id}</div>
                            <div><span className="font-medium">name:</span> {voice.name}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              {!loading && !error && modelOptions.length === 0 && (
                <div className="text-muted-foreground text-xs mt-2">No models found or not fetched yet.</div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Integrations;
