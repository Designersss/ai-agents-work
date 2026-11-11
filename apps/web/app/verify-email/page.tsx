import { AuthLayout } from '../../components/auth-layout';
import { AuthPanel } from '../../components/auth-panel';

export default function Page() {
  return <AuthLayout><AuthPanel mode="verify-email" /></AuthLayout>;
}
