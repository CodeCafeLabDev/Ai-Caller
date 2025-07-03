import React, { useState } from 'react';
import IntegrationCard from './integration-card'; // Import the IntegrationCard component
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const ELEVEN_LABS_ID = 'elevenlabs';

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

  const handleConfigure = (integrationId: string) => {
    if (integrationId === ELEVEN_LABS_ID) {
      setSheetOpen(true);
    } else {
      // Placeholder for other integrations
      alert('Configuration for this integration is not implemented yet.');
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const handleConfigureElevenLabs = async () => {
    setLoading(true);
    setError(null);
    setModals([]);
    try {
      // Fetch models from Eleven Labs API
      const response = await fetch('https://api.elevenlabs.io/v1/models', {
        headers: {
          'xi-api-key': apiKey,
        },
      });
      if (!response.ok) {
        throw new Error('Invalid API key or failed to fetch models.');
      }
      const data = await response.json();
      // The correct key is 'models', each with 'model_id' and 'name'
      setModals(Array.isArray(data.models) ? data.models.map((m: any) => `${m.model_id} - ${m.name}`) : []);
      // Update status to Connected
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === ELEVEN_LABS_ID ? { ...i, status: 'Connected' } : i
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to fetch models.');
    } finally {
      setLoading(false);
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
            <label className="font-medium">API Key</label>
            <Input
              type="text"
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="Enter your Eleven Labs API key"
              className="mb-2"
            />
            <Button onClick={handleConfigureElevenLabs} disabled={loading || !apiKey}>
              {loading ? 'Configuring...' : 'Configure'}
            </Button>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            {/* Debug: Show raw modals array and message if empty */}
            {modals.length === 0 && !loading && !error && (
              <div className="text-muted-foreground text-xs mt-2">No models found or not fetched yet.</div>
            )}
            {modals.length > 0 && (
              <div className="mt-4 flex-1 overflow-y-auto border rounded p-2 max-h-60">
                <div className="font-semibold mb-2">Modals List</div>
                <ul className="list-disc pl-5">
                  {modals.map((modal, idx) => (
                    <li key={idx}>{modal}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Integrations;
