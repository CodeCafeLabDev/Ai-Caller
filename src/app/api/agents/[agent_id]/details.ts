import { NextRequest, NextResponse } from 'next/server';
import { elevenLabsApi } from '@/lib/elevenlabsApi';
// import your DB functions here (pseudo: getAgentFromDB, updateAgentInDB)

// Helper to fetch agent from ElevenLabs
async function fetchElevenLabsAgent(agentId: string) {
  // Replace with your actual ElevenLabs API call
  const res = await fetch(`${process.env.ELEVENLABS_BASE_URL}/v1/convai/agents/${agentId}`, {
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' },
  });
  if (!res.ok) throw new Error('Failed to fetch from ElevenLabs');
  return res.json();
}

// Helper to update agent in ElevenLabs
async function updateElevenLabsAgent(agentId: string, data: any) {
  const res = await fetch(`${process.env.ELEVENLABS_BASE_URL}/v1/convai/agents/${agentId}`, {
    method: 'PATCH',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update ElevenLabs');
  return res.json();
}

export async function GET(req: NextRequest, { params }: { params: { agent_id: string } }) {
  const { agent_id } = params;
  try {
    // Fetch from ElevenLabs
    const elevenlabs = await fetchElevenLabsAgent(agent_id);
    // Fetch from local DB (replace with your actual DB call)
    // const local = await getAgentFromDB(agent_id);
    const local = {}; // TODO: implement
    return NextResponse.json({ elevenlabs, local });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { agent_id: string } }) {
  const { agent_id } = params;
  try {
    const body = await req.json();
    // Update ElevenLabs
    const elevenlabs = await updateElevenLabsAgent(agent_id, body.elevenlabs);
    // Update local DB (replace with your actual DB call)
    // const local = await updateAgentInDB(agent_id, body.local);
    const local = {}; // TODO: implement
    return NextResponse.json({ elevenlabs, local });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 