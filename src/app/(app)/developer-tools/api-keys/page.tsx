
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { KeyRound, PlusCircle, Trash2, Eye, EyeOff, Copy, Edit, RotateCcw, CheckCircle, XCircle, MoreHorizontal, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import type { Metadata } from 'next';

// export const metadata: Metadata = {
//   title: 'API Keys Management - AI Caller',
//   description: 'Generate, manage, and revoke API keys for client integrations. Securely handle API access and permissions.',
//   keywords: ['api keys', 'developer tools', 'authentication keys', 'api access', 'AI Caller'],
// };

type ApiKeyPermission = "read-only" | "read-write" | "campaigns:read" | "campaigns:write" | "reports:read";
type ApiKeyStatus = "Active" | "Revoked";

interface ApiKey {
  id: string;
  clientName: string;
  clientId: string;
  keyPrefix: "sk_live_" | "sk_test_";
  keySuffix: string;
  fullKey: string; 
  permissions: ApiKeyPermission[];
  createdDate: Date;
  lastUsedDate?: Date;
  status: ApiKeyStatus;
}

const generateRandomString = (length: number) : string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const generateNewApiKey = (prefix: "sk_live_" | "sk_test_"): { fullKey: string, suffix: string } => {
    const mainPart = generateRandomString(24);
    const suffix = generateRandomString(4);
    return { fullKey: `${prefix}${mainPart}${suffix}`, suffix: suffix };
}

const initialApiKeys: ApiKey[] = [
  { id: "key1", clientName: "Innovate Corp", clientId: "client_1", keyPrefix: "sk_live_", keySuffix: "a1b2", fullKey: "sk_live_xxxxxxxxxxxxxxxxxxxxxxxxa1b2", permissions: ["read-write", "campaigns:write"], createdDate: new Date(2023, 0, 15), lastUsedDate: new Date(2024, 6, 20), status: "Active" },
  { id: "key2", clientName: "Solutions Ltd", clientId: "client_2", keyPrefix: "sk_test_", keySuffix: "c3d4", fullKey: "sk_test_yyyyyyyyyyyyyyyyyyyyyyyc3d4", permissions: ["read-only", "reports:read"], createdDate: new Date(2023, 2, 22), status: "Active" },
  { id: "key3", clientName: "Tech Ventures", clientId: "client_3", keyPrefix: "sk_live_", keySuffix: "e5f6", fullKey: "sk_live_zzzzzzzzzzzzzzzzzzzzzzzze5f6", permissions: ["campaigns:read"], createdDate: new Date(2024, 4, 10), lastUsedDate: new Date(2024, 5, 1), status: "Revoked" },
];

const maskKey = (prefix: string, suffix: string): string => {
  return `${prefix}************************${suffix}`;
};

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>(initialApiKeys);
  const [visibleKeys, setVisibleKeys] = React.useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const handleGenerateNewKey = () => {
    const newKeyData = generateNewApiKey("sk_live_");
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      clientName: `Client ${apiKeys.length + 1}`, 
      clientId: `client_${apiKeys.length + 1}`,
      keyPrefix: "sk_live_",
      keySuffix: newKeyData.suffix,
      fullKey: newKeyData.fullKey,
      permissions: ["read-only"],
      createdDate: new Date(),
      status: "Active",
    };
    setApiKeys(prev => [newKey, ...prev]);
    toast({
      title: "API Key Generated (Simulated)",
      description: `New key for ${newKey.clientName} created. Key: ${maskKey(newKey.keyPrefix, newKey.keySuffix)}`,
    });
  };

  const handleRevokeReactivate = (keyId: string) => {
    setApiKeys(prev => prev.map(key => {
      if (key.id === keyId) {
        const newStatus = key.status === "Active" ? "Revoked" : "Active";
        toast({ title: `Key ${newStatus}`, description: `API Key for ${key.clientName} has been ${newStatus.toLowerCase()}.` });
        return { ...key, status: newStatus };
      }
      return key;
    }));
  };

  const handleRegenerateKey = (keyId: string) => {
     setApiKeys(prev => prev.map(key => {
      if (key.id === keyId) {
        const newKeyData = generateNewApiKey(key.keyPrefix);
        toast({ title: "Key Regenerated", description: `API Key for ${key.clientName} has been regenerated.` });
        return { ...key, fullKey: newKeyData.fullKey, keySuffix: newKeyData.suffix, lastUsedDate: undefined };
      }
      return key;
    }));
  };

  const handleCopyKey = (fullKey: string, clientName: string) => {
    navigator.clipboard.writeText(fullKey)
      .then(() => toast({ title: "API Key Copied", description: `Key for ${clientName} copied to clipboard.` }))
      .catch(err => toast({ title: "Copy Failed", description: "Could not copy key.", variant: "destructive" }));
  };
  
  const handleEditPermissions = (clientName: string) => {
      toast({title: "Edit Permissions", description: `Permission editing for ${clientName} is a planned feature.`, duration: 3000});
  }


  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center">
            <KeyRound className="mr-3 h-8 w-8 text-primary" /> API Keys Management
          </h1>
          <p className="text-muted-foreground">
            Manage client-specific API keys, permissions, and usage.
          </p>
        </div>
        <Button onClick={handleGenerateNewKey}>
            <PlusCircle className="mr-2 h-4 w-4" /> Generate New API Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client API Keys</CardTitle>
          <CardDescription>API keys generated for individual client integrations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead className="min-w-[300px]">API Key</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created On</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.clientName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type={visibleKeys[apiKey.id] ? "text" : "password"}
                          value={visibleKeys[apiKey.id] ? apiKey.fullKey : maskKey(apiKey.keyPrefix, apiKey.keySuffix)}
                          readOnly
                          className="font-mono text-xs h-8 flex-grow bg-muted"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleKeyVisibility(apiKey.id)}>
                          {visibleKeys[apiKey.id] ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {apiKey.permissions.map(perm => <Badge key={perm} variant="secondary" className="text-xs">{perm}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>{format(apiKey.createdDate, "MMM dd, yyyy")}</TableCell>
                    <TableCell>{apiKey.lastUsedDate ? format(apiKey.lastUsedDate, "MMM dd, yyyy, HH:mm") : "Never"}</TableCell>
                    <TableCell>
                      <Badge className={apiKey.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {apiKey.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Key Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleCopyKey(apiKey.fullKey, apiKey.clientName)}>
                                <Copy className="mr-2 h-4 w-4"/> Copy Key
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRegenerateKey(apiKey.id)}>
                                <RotateCcw className="mr-2 h-4 w-4"/> Regenerate Key
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditPermissions(apiKey.clientName)}>
                                <ShieldCheck className="mr-2 h-4 w-4"/> Edit Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem 
                                onClick={() => handleRevokeReactivate(apiKey.id)}
                                className={apiKey.status === "Active" ? "text-destructive focus:text-destructive" : "text-green-600 focus:text-green-700"}
                            >
                                {apiKey.status === "Active" ? <XCircle className="mr-2 h-4 w-4"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                                {apiKey.status === "Active" ? "Revoke Key" : "Reactivate Key"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           {apiKeys.length === 0 && <p className="py-8 text-center text-muted-foreground">No API keys generated yet. Click "Generate New API Key" to start.</p>}
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