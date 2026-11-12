import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

// Check the real Better Auth session on the server before rendering a private page.
export async function requireSession(): Promise<void> {
  const cookie = (await headers()).get('cookie');
  if (!cookie) redirect('/sign-in');

  const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const response = await fetch(new URL('/api/auth/get-session', apiOrigin), {
    headers: { cookie },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Cannot verify authentication session');

  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('user' in data)) redirect('/sign-in');
  const user = data.user;
  if (!user || typeof user !== 'object' || !('id' in user) || typeof user.id !== 'string') {
    redirect('/sign-in');
  }
}
