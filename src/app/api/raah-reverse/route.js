export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lon = searchParams.get('lon');
    const lat = searchParams.get('lat');
    const resultType = searchParams.get('result_type') || 'neighborhood';

    if (!lon || !lat) {
      return NextResponse.json({ error: 'Missing lon/lat' }, { status: 400 });
    }

    const targetUrl = `https://reverse-geocoding.raah.ir/v1/features?result_type=${encodeURIComponent(resultType)}&location=${encodeURIComponent(lon)},${encodeURIComponent(lat)}`;
    console.log(targetUrl)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const resp = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const text = await resp.text();
    if (!resp.ok) {
      return new NextResponse(text || 'Upstream error', { status: resp.status });
    }

    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const status = err?.name === 'AbortError' ? 504 : 500;
    return NextResponse.json({ error: err?.message || 'Proxy error' }, { status });
  }
}
