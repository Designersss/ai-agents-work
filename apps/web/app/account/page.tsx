import { AuthLayout } from '../../components/auth-layout';
import { AccountPanel } from '../../components/account-panel';
import { requireSession } from '../../lib/require-session';

export default async function Page() {
  await requireSession();
  return <AuthLayout><AccountPanel/></AuthLayout>;
}
