import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Channel = 'stable' | 'beta';

function httpsUrl(value: string | undefined): string | null {
  const raw = (value || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function channelConfig(channel: Channel) {
  const prefix = channel === 'beta' ? 'DESKTOP_BETA' : 'DESKTOP_STABLE';
  return {
    version: (process.env[`${prefix}_VERSION`] || '').trim(),
    windowsUrl: httpsUrl(process.env[`${prefix}_WINDOWS_URL`]),
    sha256: (process.env[`${prefix}_WINDOWS_SHA256`] || '').trim().toLowerCase(),
    releaseNotes: (process.env[`${prefix}_RELEASE_NOTES`] || '').trim(),
    mandatory: String(process.env[`${prefix}_MANDATORY`] || '').toLowerCase() === 'true',
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const channel: Channel = searchParams.get('channel') === 'beta' ? 'beta' : 'stable';
  const platform = (searchParams.get('platform') || '').toLowerCase();
  const arch = (searchParams.get('arch') || '').toLowerCase();
  const current = (searchParams.get('current') || '').trim();
  const config = channelConfig(channel);

  // v1 currently distributes a verified Windows x64 installer only. Returning a
  // non-error unconfigured response keeps old clients usable while other
  // platforms are prepared.
  if (!['win32', 'windows'].includes(platform) || (arch && !['x64', 'amd64'].includes(arch))) {
    return NextResponse.json({
      configured: false,
      channel,
      current,
      reason: 'No release feed is configured for this platform yet.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const checksumOk = /^[a-f0-9]{64}$/.test(config.sha256);
  if (!config.version || !config.windowsUrl || !checksumOk) {
    return NextResponse.json({
      configured: false,
      channel,
      current,
      reason: 'The owner has not finished configuring the verified Windows update feed.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json({
    configured: true,
    channel,
    current,
    version: config.version,
    downloadUrl: config.windowsUrl,
    sha256: config.sha256,
    releaseNotes: config.releaseNotes,
    mandatory: config.mandatory,
  }, {
    headers: {
      // Release metadata may change at any time after a new owner upload.
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
