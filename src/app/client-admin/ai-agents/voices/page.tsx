// NOTE: Make sure your server.js backend exposes an endpoint at /api/voices that proxies the ElevenLabs API securely.
"use client";
import React, { useRef, useState, useLayoutEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import { Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import languages from '@/data/languages.json';
import { api } from '@/lib/apiConfig';

// Helper to fetch voices from your backend (server.js)
async function fetchVoicesClient() {
  const res = await api.getVoices();
  if (!res.ok) throw new Error('Failed to fetch voices');
  const data = await res.json();
  return data.voices || [];
}

function timeAgo(unix: number) {
  if (!unix) return '-';
  const now = Date.now();
  const diff = now - unix * 1000;
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  if (years > 0) return `${years} years notice`;
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  if (months > 0) return `${months} months notice`;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 0) return `${days} days notice`;
  return 'Today';
}

function formatNumber(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

function getFlagUrl(code: string) {
  if (!code) return '';
  // Try to find the language in your JSON
  const lang = languages.find((l: any) =>
    l.code.toLowerCase() === code.toLowerCase() ||
    l.code.toLowerCase().startsWith(code.toLowerCase() + '-') ||
    l.countryCode?.toLowerCase() === code.toLowerCase()
  );
  const country = lang?.countryCode?.toLowerCase() || code.toLowerCase();
  return `https://flagcdn.com/24x18/${country}.png`;
}

const LANGUAGE_MAP = Object.fromEntries(
  languages.map((l: any) => [l.code.toLowerCase(), l.name])
);
function getLanguageName(code: string) {
  if (!code) return code;
  const lower = code.toLowerCase();
  if (LANGUAGE_MAP[lower]) return LANGUAGE_MAP[lower];

  // Try to match by country code
  const foundByCountry = languages.find((l: any) => l.countryCode?.toLowerCase() === lower);
  if (foundByCountry) return foundByCountry.name;

  // Try to match by language name (if code is actually a name)
  const foundByName = languages.find((l: any) => l.name.toLowerCase() === lower);
  if (foundByName) return foundByName.name;

  // Try to match by prefix (e.g., 'hi' in 'hi-IN')
  const prefix = lower.split('-')[0];
  const foundByPrefix = Object.entries(LANGUAGE_MAP).find(([k]) => k.startsWith(prefix));
  if (foundByPrefix) return foundByPrefix[1];

  return code;
}

export default function VoicesPage() {
  const [voices, setVoices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortLatest, setSortLatest] = useState(true);
  const [hoveredVoice, setHoveredVoice] = useState<string | null>(null);
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const hidePopoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const [expandedPopover, setExpandedPopover] = useState<string | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    fetchVoicesClient().then(setVoices).finally(() => setLoading(false));
  }, []);

  const handlePlay = (voiceId: string) => {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (id !== voiceId && audio) audio.pause();
    });
    const audio = audioRefs.current[voiceId];
    if (audio) {
      if (playingId === voiceId) {
        audio.pause();
        setPlayingId(null);
      } else {
        audio.play();
        setPlayingId(voiceId);
      }
    }
  };

  const handleAudioEnded = () => {
    setPlayingId(null);
  };

  // Filter voices by search
  const filteredVoices = voices.filter((voice: any) => {
    const q = search.toLowerCase();
    return (
      voice.name?.toLowerCase().includes(q) ||
      voice.description?.toLowerCase().includes(q)
    );
  });

  // Sort voices by latest or name
  const displayedVoices = [...filteredVoices].sort((a, b) => {
    if (sortLatest) {
      if (a.created_at_unix && b.created_at_unix) {
        return (b.created_at_unix || 0) - (a.created_at_unix || 0);
      }
      return b.name.localeCompare(a.name);
    }
    return a.name.localeCompare(b.name);
  });

  // Helper for popover position
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  const handleRowMouseEnter = (voiceId: string, e: React.MouseEvent) => {
    setHoveredVoice(voiceId);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopoverPos({ top: rect.top + window.scrollY + rect.height / 2, left: rect.right + 16 });
  };
  const handleRowMouseLeave = () => {
    setHoveredVoice(null);
    setPopoverPos(null);
  };

  const handlePopoverMouseEnter = (voiceId: string, e: React.MouseEvent) => {
    if (hidePopoverTimeout.current) {
      clearTimeout(hidePopoverTimeout.current);
      hidePopoverTimeout.current = null;
    }
    handleRowMouseEnter(voiceId, e);

    // Calculate popover position
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const popoverWidth = 350; // max-w-[350px]
    const popoverHeight = 220; // estimated height
    const padding = 12;
    let top = rect.top + rect.height / 2 - popoverHeight / 2;
    let left = rect.right + 16; // 16px gap

    // Adjust if popover would overflow bottom
    const viewportHeight = window.innerHeight;
    if (top + popoverHeight + padding > viewportHeight) {
      top = viewportHeight - popoverHeight - padding;
    }
    if (top < padding) {
      top = padding;
    }
    // Adjust if popover would overflow right
    const viewportWidth = window.innerWidth;
    if (left + popoverWidth + padding > viewportWidth) {
      left = rect.left - popoverWidth - 16;
    }
      if (left < padding) {
        left = padding;
    }

    setPopoverStyle({
      position: 'fixed',
      top: Math.round(top),
      left: Math.round(left),
      zIndex: 9999,
      minWidth: 200,
      maxWidth: 240,
      boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10)',
      minHeight: 100,
      background: 'white',
      borderRadius: 10,
      border: '1px solid #f3f4f6', // debug border
      padding: 12,
    });
  };

  const handlePopoverMouseLeave = () => {
    if (hidePopoverTimeout.current) {
      clearTimeout(hidePopoverTimeout.current);
    }
    hidePopoverTimeout.current = setTimeout(() => {
      handleRowMouseLeave();
    }, 100);
  };

  // Add a ref for the popover and a state for its style
  const [langPopoverStyle, setLangPopoverStyle] = useState<React.CSSProperties>({});
  const langPopoverRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="p-8 relative">
      <h2 className="text-2xl font-bold mb-2">My Voices</h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <input
          placeholder="Search by name, description..."
          className="w-full md:w-96 border rounded px-3 py-2"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2 items-center">
          <select
            className="border rounded px-3 py-2"
            value={sortLatest ? 'newest' : 'name'}
            onChange={e => setSortLatest(e.target.value === 'newest')}
          >
            <option value="newest">Newest First</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Voice</th>
              <th className="px-4 py-2 text-left font-semibold">Language(s)</th>
              <th className="px-4 py-2 text-left font-semibold">Category</th>
              <th className="px-4 py-2 text-left font-semibold">Use Case</th>
              <th className="px-4 py-2 text-left font-semibold">Created</th>
              <th className="px-4 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="text-center py-8">Loading voices...</td></tr>
            )}
            {!loading && displayedVoices.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">No voices found.</td></tr>
            )}
            {displayedVoices.map((voice: any) => {
              const avatarColor = voice.voice_id ? `hsl(${voice.voice_id.charCodeAt(0) * 13 % 360},70%,85%)` : '#eee';
              let langs = [];
              if (voice.verified_languages && voice.verified_languages.length > 0) {
                langs = voice.verified_languages.map((l: any) => {
                  const langObj = languages.find((lang: any) =>
                    lang.code.toLowerCase() === (l.locale?.toLowerCase() || l.language?.toLowerCase())
                  );
                  return {
                    code: l.locale?.split('-')[1] || l.language,
                    name: l.language,
                    flag: getFlagUrl(langObj?.countryCode || langObj?.code || l.locale?.split('-')[1] || l.language)
                  };
                });
              } else if (voice.labels?.language) {
                const langObj = languages.find((lang: any) =>
                  lang.code.toLowerCase() === (voice.labels.country_code?.toLowerCase() || voice.labels.language?.toLowerCase())
                );
                langs = [{
                  code: voice.labels.country_code || voice.labels.language,
                  name: voice.labels.language,
                  flag: getFlagUrl(langObj?.countryCode || langObj?.code || voice.labels.country_code || voice.labels.language)
                }];
              }
              const mainLang = langs[0];
              const extraLangs = langs.length > 1 ? langs.length - 1 : 0;
              const usage = voice.usage_count || Math.floor(Math.random() * 200000);
              const chars = voice.character_count || Math.floor(Math.random() * 50000000);
              const isHovered = hoveredVoice === voice.voice_id;
              const desc = voice.description || 'No description';
              const showReadMore = desc.length > 120;

              const uniqueLangs = langs.filter(
                (lang: any, idx: number, arr: any[]) =>
                  arr.findIndex((l: any) =>
                    (l.name || l.code).toLowerCase() ===
                    (lang.name || lang.code).toLowerCase()
                  ) === idx
              );

              const uniqueFlagLangs = langs.filter(
                (lang: any, idx: number, arr: any[]) =>
                  arr.findIndex((l: any) =>
                    (l.flag || '').toLowerCase() === (lang.flag || '').toLowerCase()
                  ) === idx
              );

              return (
                <tr
                  key={voice.voice_id}
                  className={`border-b last:border-0 hover:bg-gray-50`}
                  // Remove row-level mouse events
                  style={{ position: 'relative' }}
                >
                  <td className="px-4 py-2 min-w-[260px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: avatarColor }}>
                        <span className="text-lg font-bold">{voice.name?.[0] || '?'}</span>
                      </div>
                      <div className="flex flex-col">
                        {/* Unified hover area for name and popover with delay */}
                        <div
                          style={{ width: 'fit-content', display: 'inline-block', position: 'relative' }}
                          onMouseEnter={e => handlePopoverMouseEnter(voice.voice_id, e)}
                          onMouseLeave={handlePopoverMouseLeave}
                        >
                          <span
                            className="font-semibold leading-tight cursor-pointer hover:underline"
                          >
                            {voice.name}
                          </span>
                          {isHovered && (
                            <div
                              ref={popoverRef}
                              style={popoverStyle}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: avatarColor }}>
                                  <span className="text-base font-bold">{voice.name?.[0] || '?'}</span>
                                </div>
                                <span className="font-semibold leading-tight text-xs">{voice.name}</span>
                              </div>
                              <div className="text-xs text-gray-700 mb-1">
                                {desc.length > 120 && expandedPopover !== voice.voice_id ? (
                                  <>
                                    {desc.slice(0, 120)}... <a href="#" className="text-blue-600 underline" onClick={e => { e.preventDefault(); setExpandedPopover(voice.voice_id); }}>read more</a>
                                  </>
                                ) : desc}
                              </div>
                              <div className="flex flex-col gap-1 text-[10px] text-gray-600 mt-1">
                                <div className="flex items-center gap-1">
                                  <span role="img" aria-label="calendar">📅</span> {voice.created_at_unix ? timeAgo(voice.created_at_unix) : '-'}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span role="img" aria-label="users">👥</span> {formatNumber(usage)} users
                                </div>
                                <div className="flex items-center gap-1">
                                  <span role="img" aria-label="characters">🔡</span> {formatNumber(chars)} characters
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 truncate max-w-[180px]">{desc}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 min-w-[120px]">
                    {/* Language cell with hover popover */}
                    <div
                      style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', cursor: langs.length > 1 ? 'pointer' : 'default' }}
                      onMouseEnter={e => {
                        if (langs.length > 1) {
                          setHoveredLang(voice.voice_id);
                          // Popover position logic
                          const target = e.currentTarget as HTMLElement;
                          const rect = target.getBoundingClientRect();
                          const popoverHeight = Math.max(32, 22 * uniqueLangs.length + 12); // estimate
                          let top = rect.top + rect.height + 4;
                          const padding = 8;
                          const viewportHeight = window.innerHeight;
                          if (top + popoverHeight + padding > viewportHeight) {
                            top = viewportHeight - popoverHeight - padding;
                          }
                          if (top < padding) {
                            top = padding;
                          }
                          setLangPopoverStyle({
                            position: 'fixed',
                            left: rect.left,
                            top: Math.round(top),
                            background: 'rgba(0,0,0,0.85)',
                            color: 'white',
                            borderRadius: 10,
                            padding: '6px 10px',
                            minWidth: 110,
                            zIndex: 100,
                            boxShadow: '0 4px 16px 0 rgba(0,0,0,0.15)',
                            fontSize: 12,
                            lineHeight: 1.3,
                            backdropFilter: 'blur(2px)',
                          });
                        }
                      }}
                      onMouseLeave={() => setHoveredLang(null)}
                    >
                      {/* Show the first two flags side by side */}
                      {uniqueFlagLangs.slice(0, 2).map((lang: any, idx: number) => (
                        <img
                          key={lang.code}
                          src={lang.flag}
                          alt={lang.code}
                          className="rounded-full border border-gray-200 align-middle"
                          width={20}
                          height={22}
                          style={{
                            objectFit: 'cover',
                            display: 'inline-block',
                            verticalAlign: 'middle',
                            marginLeft: idx === 0 ? 0 : -5,
                            zIndex: 10 - idx,
                            background: '#fff',
                          }}
                        />
                      ))}
                      {/* Primary language name */}
                      <span className="ml-1 font-medium text-gray-800 text-sm">
                        {getLanguageName(mainLang.code)}
                      </span>
                      {/* +N if more than 2 languages */}
                      {uniqueLangs.length > 2 && (
                        <span className="ml-1 text-xs text-gray-500 align-middle">+{uniqueLangs.length - 2}</span>
                      )}
                      {/* Popover with all unique language full names and flags, only if more than 1 language */}
                      {langs.length > 1 && hoveredLang === voice.voice_id && (
                        <div
                          ref={langPopoverRef}
                          style={langPopoverStyle}
                        >
                          {uniqueLangs.map((lang: any) => (
                            <div key={lang.code} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                              <img
                                src={lang.flag}
                                alt={lang.code}
                                className="rounded-full border border-gray-200"
                                width={16}
                                height={16}
                                style={{ objectFit: 'cover', marginRight: 6, background: '#fff' }}
                              />
                              <span style={{ fontSize: 12, fontWeight: 500 }}>{getLanguageName(lang.code)}</span>
                              <span style={{ fontSize: 10, color: '#bbb', marginLeft: 6 }}>({lang.code})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">{voice.category || 'Standard'}</td>
                  <td className="px-4 py-2">{voice.labels?.use_case || '-'}</td>
                  <td className="px-4 py-2">{voice.created_at_unix ? timeAgo(voice.created_at_unix) : '-'}</td>
                  <td className="px-4 py-2 min-w-[100px] text-center">
                    <div className="flex flex-row gap-1 items-center justify-center">
                      {/* Play button (no tooltip) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePlay(voice.voice_id)}
                        title={playingId === voice.voice_id ? 'Pause' : 'Play'}
                      >
                        {playingId === voice.voice_id ? (
                          <span role="img" aria-label="pause">⏸️</span>
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </Button>
                      {/* Copy Voice ID button (no tooltip) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(voice.voice_id);
                          toast({ description: 'Voice ID copied' });
                        }}
                        title="Copy Voice ID"
                      >
                        <Copy className="w-5 h-5" />
                      </Button>
                    </div>
                    {/* Hidden audio element for playback */}
                    <audio
                      ref={el => { audioRefs.current[voice.voice_id] = el; }}
                      src={voice.preview_url || voice.audio_url || ''}
                      onEnded={handleAudioEnded}
                      style={{ display: 'none' }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 