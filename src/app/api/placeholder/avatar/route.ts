import { NextResponse } from 'next/server';

export async function GET() {
  // Return a simple SVG placeholder avatar
  const svg = `
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#e5e7eb"/>
      <circle cx="50" cy="35" r="15" fill="#9ca3af"/>
      <path d="M20 80 Q50 60 80 80" stroke="#9ca3af" stroke-width="8" fill="none"/>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
} 