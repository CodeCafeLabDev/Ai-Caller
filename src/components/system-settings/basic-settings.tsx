import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const BasicSettings = () => {
  const [maxConcurrentCalls, setMaxConcurrentCalls] = useState(10); // Example default
  const [defaultAiVoice, setDefaultAiVoice] = useState('');
  const [speechRate, setSpeechRate] = useState(1.0); // Example default
  const [failoverNumber, setFailoverNumber] = useState('');
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [globalCallTimeout, setGlobalCallTimeout] = useState(60); // Example default

  const handleSaveChanges = () => {
    // Handle saving changes
    console.log('Saving Basic Settings:', {
      maxConcurrentCalls,
      defaultAiVoice,
      speechRate,
      failoverNumber,
      recordingEnabled,
      globalCallTimeout,
    });
    // Show a toast notification
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">Basic Settings</h2>
      <p className="text-muted-foreground">Configure basic operational settings for your AI Caller.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Max Concurrent Calls */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="maxConcurrentCalls">Max Concurrent Calls</Label>
          <Input
            id="maxConcurrentCalls"
            type="number"
            value={maxConcurrentCalls}
            onChange={(e) => setMaxConcurrentCalls(Number(e.target.value))}
            placeholder="e.g., 10"
          />
        </div>

        {/* Default AI Voice */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="defaultAiVoice">Default AI Voice</Label>
          <Select onValueChange={setDefaultAiVoice} value={defaultAiVoice}>
            <SelectTrigger id="defaultAiVoice">
              <div className="text-muted-foreground">Select a voice</div>
            </SelectTrigger>
            <SelectContent>
              {/* Replace with actual AI voice options */}
              <SelectItem value="voice1">Voice 1</SelectItem>
              <SelectItem value="voice2">Voice 2</SelectItem>
              <SelectItem value="voice3">Voice 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Speech Rate */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="speechRate">Speech Rate</Label>
          <Input
            id="speechRate"
            type="number"
            step="0.1"
            value={speechRate}
            onChange={(e) => setSpeechRate(Number(e.target.value))}
            placeholder="e.g., 1.0"
          />
        </div>

        {/* Failover Number */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="failoverNumber">Failover Number</Label>
          <Input
            id="failoverNumber"
            value={failoverNumber}
            onChange={(e) => setFailoverNumber(e.target.value)}
            placeholder="e.g., +18005551212"
          />
        </div>

        {/* Recording Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="recordingEnabled"
            checked={recordingEnabled}
            onCheckedChange={setRecordingEnabled}
          />
          <Label htmlFor="recordingEnabled">Enable Call Recording</Label>
        </div>

        {/* Global Call Timeout */}
        <div className="flex flex-col space-y-2">
          <Label htmlFor="globalCallTimeout">Global Call Timeout (seconds)</Label>
          <Input
            id="globalCallTimeout"
            type="number"
            value={globalCallTimeout}
            onChange={(e) => setGlobalCallTimeout(Number(e.target.value))}
            placeholder="e.g., 60"
          />
        </div>
      </div>

      {/* Save Changes Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  );
};

export default BasicSettings;
