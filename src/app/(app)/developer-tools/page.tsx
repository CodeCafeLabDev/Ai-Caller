
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Link as LinkIcon, KeyRound, ListChecks, Terminal } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation & Developer Tools - Voxaiomni',
  description: 'Explore API documentation, manage API keys, webhooks, and view integration logs for Voxaiomni.',
  keywords: ['api documentation', 'developer tools', 'api keys', 'webhooks', 'integration logs', 'voxaiomni api'],
};

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <BookOpen className="mr-3 h-8 w-8 text-primary" /> API Documentation
        </h1>
        <p className="text-muted-foreground">
          Explore and understand how to integrate with the Voxaiomni API.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Follow these steps to start using our API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">1. Authentication</h3>
            <p className="text-sm text-muted-foreground">
              Obtain your API key from the "API Keys" section. Include it in the 
              <code>Authorization</code> header of your requests as a Bearer token: 
              <code>Authorization: Bearer YOUR_API_KEY</code>.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">2. Rate Limits</h3>
            <p className="text-sm text-muted-foreground">
              Our API is rate-limited to ensure fair usage. Standard limits are 100 requests per minute. Check response headers for current limit status.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">3. Base URL</h3>
            <p className="text-sm text-muted-foreground">
              All API endpoints are prefixed with: <code>https://api.voxaiomni.com/v1/</code>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Core API Endpoints (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-md flex items-center"><Terminal className="mr-2 h-5 w-5 text-primary"/>Campaign Management</h4>
            <p className="text-sm text-muted-foreground">Endpoints for creating, updating, and managing campaigns.</p>
            <ul className="list-disc list-inside pl-4 mt-2 text-xs">
              <li><code>POST /campaigns</code> - Create a new campaign.</li>
              <li><code>GET /campaigns</code> - List all campaigns.</li>
              <li><code>GET /campaigns/{'{campaignId}'}</code> - Get campaign details.</li>
              <li><code>PUT /campaigns/{'{campaignId}'}</code> - Update a campaign.</li>
            </ul>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-md flex items-center"><Terminal className="mr-2 h-5 w-5 text-primary"/>Call Operations</h4>
            <p className="text-sm text-muted-foreground">Initiate and manage calls through the API.</p>
             <ul className="list-disc list-inside pl-4 mt-2 text-xs">
              <li><code>POST /calls/initiate</code> - Initiate an outbound call.</li>
              <li><code>GET /calls/{'{callId}'}</code> - Get call status and details.</li>
            </ul>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-md flex items-center"><Terminal className="mr-2 h-5 w-5 text-primary"/>Client Data</h4>
            <p className="text-sm text-muted-foreground">Access and manage client-specific information.</p>
            <ul className="list-disc list-inside pl-4 mt-2 text-xs">
                <li><code>GET /clients/{'{clientId}'}/data</code> - Retrieve client data.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Client Libraries & SDKs (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                Official client libraries for Python, Node.js, and Java will be available soon to simplify API integration.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
