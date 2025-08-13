import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Resolve base URL robustly; default to ElevenLabs public API if env is missing
const ELEVEN_BASE = (() => {
  const fromEnv = process.env.ELEVENLABS_BASE_URL?.replace(/\/$/, '');
  if (fromEnv) {
    // If the env doesn't already include /v1/convai, append it
    if (/\/v1(\/convai)?$/.test(fromEnv)) return fromEnv + (fromEnv.endsWith('/convai') ? '' : '/convai');
    return fromEnv + '/v1/convai';
  }
  return 'https://api.elevenlabs.io/v1/convai';
})();

const XI_KEY = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';

async function fetchElevenLabsAgent(agentId: string) {
  const res = await fetch(`${ELEVEN_BASE}/agents/${agentId}`, {
    headers: { 'xi-api-key': XI_KEY },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch from ElevenLabs (${res.status}): ${text}`);
  }
  return res.json();
}

async function updateElevenLabsAgent(agentId: string, data: any) {
  const res = await fetch(`${ELEVEN_BASE}/agents/${agentId}`, {
    method: 'PATCH',
    headers: {
      'xi-api-key': XI_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to update ElevenLabs (${res.status}): ${text}`);
  }
  return res.json();
}

export async function GET(req: NextRequest, { params }: { params: { agent_id: string } }) {
  const { agent_id } = params;
  try {
    const elevenlabs = await fetchElevenLabsAgent(agent_id);
    const local = {};
    return NextResponse.json({ success: true, elevenlabs, local });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { agent_id: string } }) {
  const { agent_id } = params;
  try {
    const body = await req.json();
    const elevenlabs = await updateElevenLabsAgent(agent_id, body.elevenlabs);
    const local = {};
    return NextResponse.json({ success: true, elevenlabs, local });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}