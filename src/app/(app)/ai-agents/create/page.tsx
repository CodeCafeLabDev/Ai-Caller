
"use client";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { elevenLabsApi } from "@/lib/elevenlabsApi";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/cn";
import { ChevronsUpDown } from "lucide-react";
import { api } from "@/lib/apiConfig";

const MAX_LENGTH = 50;

export default function CreateAgentPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<{ id: string; companyName: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(undefined);
  const [clientComboboxOpen, setClientComboboxOpen] = useState(false);
  const [search, setSearch] = useState("");

  const router = useRouter();

  // Fetch clients on load
  React.useEffect(() => {
    api.getClients()
      .then(res => res.json())
      .then(data => setClients(data.data || []));
  }, []);

  const filteredClients = clients.filter(client =>
    client.companyName.toLowerCase().includes(search.toLowerCase())
  );

  const isValid = name.trim().length > 0 && name.length <= MAX_LENGTH && typeof selectedClientId === 'number' && !isNaN(selectedClientId);

  const handleCreateAgent = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("http://localhost:5000/api/elevenlabs/create-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_config: { agent: {} },
          name: name.trim(),
          client_id: selectedClientId, // always a number
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess(true);
        setTimeout(() => {
          router.push(`/ai-agents/create/details/${data.agent_id}`);
        }, 500);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to create agent.");
      }
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white overflow-hidden">
      <div className="w-full max-w-xl flex flex-col items-center">
        <h1 className="text-xl md:text-2xl font-bold mb-1 w-full text-left">Name your agent</h1>
        <p className="text-sm text-gray-500 mb-4 w-full text-left">
          Choose a name that reflects your agent's purpose
        </p>
        {/* Client Dropdown */}
        <div className="w-full max-w-md mb-4">
          <Popover open={clientComboboxOpen} onOpenChange={setClientComboboxOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between" onClick={() => setClientComboboxOpen(true)}>
                {typeof selectedClientId === 'number'
                  ? clients.find(client => Number(client.id) === selectedClientId)?.companyName
                  : "Select client..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[550px] p-0">
              <Command>
                <CommandInput
                  placeholder="Search client..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <CommandEmpty>No client found.</CommandEmpty>
                  <CommandGroup>
                    {filteredClients.map(client => (
                      <CommandItem
                        key={client.id}
                        value={client.companyName}
                        onSelect={() => {
                          setSelectedClientId(Number(client.id));
                          setClientComboboxOpen(false);
                          setSearch("");
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedClientId === Number(client.id) ? "opacity-100" : "opacity-0")} />
                        {client.companyName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {/* End Client Dropdown */}
        <input
          type="text"
          placeholder="Enter agent name..."
          value={name}
          maxLength={MAX_LENGTH}
          onChange={e => setName(e.target.value)}
          className="w-full text-base px-4 py-3 border rounded-lg mb-1 focus:outline-none focus:ring-2 focus:ring-black transition-all text-center font-semibold"
          style={{ boxSizing: "border-box" }}
        />
        <div className="w-full text-center text-xs text-gray-500 mb-5">{name.length}/{MAX_LENGTH} characters</div>
        <button
          className={`w-full max-w-md flex items-center justify-center gap-2 py-2 rounded-lg text-base font-medium transition-colors mb-6 ${isValid && !loading ? 'bg-black text-white cursor-pointer' : 'bg-gray-400 text-white cursor-not-allowed'}`}
          disabled={!isValid || loading}
          onClick={handleCreateAgent}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Create Agent
        </button>
        {success && <div className="text-green-600 text-sm mb-2">Agent created successfully!</div>}
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      </div>
    </div>
  );
}
