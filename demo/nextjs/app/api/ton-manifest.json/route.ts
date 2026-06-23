import { NextResponse } from 'next/server'
import { APP_CONFIG } from '@/app/config'

export async function GET() {
  const manifest = {
    url: APP_CONFIG.miniAppUrl,
    name: APP_CONFIG.name, 
    iconUrl: APP_CONFIG.icon,
  };

  return NextResponse.json(manifest, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', 
    },
  });
}
