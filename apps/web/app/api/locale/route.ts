import { cookies } from 'next/headers';
import { isLocale } from '../../../lib/i18n';

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return new Response(null, { status: 415 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || !('locale' in body) || !isLocale(body.locale)) {
    return Response.json({ error: 'INVALID_LOCALE' }, { status: 400 });
  }
  (await cookies()).set('vimla-locale', body.locale, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365
  });
  return new Response(null, { status: 204 });
}
