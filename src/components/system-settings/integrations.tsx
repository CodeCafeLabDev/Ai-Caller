import React from 'react';
import IntegrationCard from './integration-card'; // Import the IntegrationCard component

const Integrations = () => {
  // Define integration data (replace with actual data from your backend)
  const integrations = [
    { id: 'hubspot', name: 'HubSpot CRM', status: 'Connected' },
    { id: 'zoho', name: 'Zoho CRM', status: 'Not Connected' },
    { id: 'salesforce', name: 'Salesforce CRM', status: 'Connected' },
    { id: 'whatsapp', name: 'WhatsApp Cloud API', status: 'Not Connected' },
    { id: 'twilio', name: 'Twilio', status: 'Connected' },
    { id: 'webhooks', name: 'Webhooks', status: 'Connected' },
  ];

  const handleConfigure = (integrationId: string) => {
    // Handle configuration logic for each integration
    console.log('Configure integration:', integrationId);
    // You would typically open a modal or navigate to a configuration page here
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Integrations</h2>
      <p className="text-muted-foreground">Manage third-party integrations and API settings.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            name={integration.name}
            status={integration.status as 'Connected' | 'Not Connected'} // Cast status for type safety
            onConfigure={() => handleConfigure(integration.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Integrations;
