import { AuthLayout } from '../../components/auth-layout';
import { AuthPanel } from '../../components/auth-panel';

export default async function Page({ searchParams }: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const params = await searchParams;
  return <AuthLayout>
    <AuthPanel mode="reset-password" token={params.token} invalidResetLink={Boolean(params.error)} />
  </AuthLayout>;
}
