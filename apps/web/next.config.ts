import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const config: NextConfig = {
  reactStrictMode: true
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
export default withNextIntl(config);
