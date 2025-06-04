
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, PlusCircle, Trash2, Eye, EyeOff } from "lucide-react"; // Using Eye and EyeOff for toggle visibility

export default function ApiKeysPage() {
  // This is a placeholder. In a real app, you'd manage state for API keys.
  const mockApiKeys = [
    { id: "key1", clientName: "Innovate Corp", key: "sk_live_xxxxxxxxxxxx1234", created: "2023-01-15", lastUsed: "2024-07-20", active: true },
    { id: "key2", clientName: "Solutions Ltd", key: "sk_test_xxxxxxxxxxxx5678", created: "2023-03-22", lastUsed: "Never", active: false },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <KeyRound className="mr-3 h-8 w-8 text-primary" /> API Keys Management
          </h1>
          <p className="text-muted-foreground">
            Manage API keys for client integrations and your own development.
          </p>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Generate New API Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client-Specific API Keys</CardTitle>
          <CardDescription>API keys generated for individual client access.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockApiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-semibold">{apiKey.clientName}</h3>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Input type="password" value={apiKey.key} readOnly className="mr-2 font-mono text-xs h-7 w-auto flex-grow" />
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-4 w-4"/></Button> {}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created: {apiKey.created} | Last Used: {apiKey.lastUsed} | Status: {apiKey.active ? "Active" : "Inactive"}
                  </p>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button variant="outline" size="sm">Revoke</Button>
                  <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4"/></Button>
                </div>
              </div>
            ))}
             {mockApiKeys.length === 0 && <p className="text-muted-foreground">No client-specific API keys generated yet.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform API Keys (Admin/System)</CardTitle>
           <CardDescription>Keys for internal system use or administrative integrations.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This section will list API keys for platform-level integrations, separate from client-specific keys.</p>
           <div className="mt-4 p-6 border rounded-lg text-center text-muted-foreground">
             Platform API key management will be here.
           </div>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>Best Practices for API Key Security</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Keep keys confidential:</strong> Treat API keys like passwords. Do not embed them directly in client-side code or commit them to version control.</p>
            <p><strong>Use environment variables:</strong> Store API keys in environment variables on your server.</p>
            <p><strong>Principle of least privilege:</strong> Generate keys with only the necessary permissions for the integration.</p>
            <p><strong>Regularly rotate keys:</strong> Periodically revoke old keys and generate new ones, especially if a compromise is suspected.</p>
            <p><strong>Monitor API usage:</strong> Keep an eye on the "Last Used" timestamp and integration logs to detect suspicious activity.</p>
        </CardContent>
      </Card>
    </div>
  );
}

    