import { AuthLayout } from '../../components/auth-layout';
import { AuthPanel } from '../../components/auth-panel';

export default async function Page({ searchParams }: {
  searchParams: Promise<{ verified?: string }>
}) {
  const params = await searchParams;
  return <AuthLayout><AuthPanel mode="sign-in" verified={params.verified === '1'} /></AuthLayout>;
}
