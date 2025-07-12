
"use client";
import { Check } from "lucide-react";
import { useState } from "react";

const MAX_LENGTH = 50;

export default function CreateAgentPage() {
  const [name, setName] = useState("");

  const isValid = name.trim().length > 0;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white overflow-hidden">
      <div className="w-full max-w-xl flex flex-col items-center">
        <h1 className="text-xl md:text-2xl font-bold mb-1 w-full text-left">Name your agent</h1>
        <p className="text-sm text-gray-500 mb-4 w-full text-left">
          Choose a name that reflects your agent's purpose
        </p>
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
          className={`w-full max-w-md flex items-center justify-center gap-2 py-2 rounded-lg text-base font-medium transition-colors mb-6 ${isValid ? 'bg-black text-white cursor-pointer' : 'bg-gray-400 text-white cursor-not-allowed'}`}
          disabled={!isValid}
        >
          <Check className="w-4 h-4" /> Create Agent
        </button>
      </div>
    </div>
  );
}
