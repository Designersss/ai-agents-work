import nodemailer from 'nodemailer';

export type MailLocale = 'ru' | 'en' | 'zh-CN' | 'ja' | 'sv-SE';
type MailKind = 'verify' | 'reset';

const copy: Record<MailLocale, Record<MailKind, { subject: string; introduction: string }>> = {
  ru: {
    verify: { subject: 'Vimla — подтвердите адрес почты', introduction: 'Чтобы подтвердить email для Vimla, откройте эту ссылку:' },
    reset: { subject: 'Vimla — восстановление пароля', introduction: 'Для смены пароля Vimla откройте эту ссылку:' }
  },
  en: {
    verify: { subject: 'Vimla — verify your email', introduction: 'To verify your email for Vimla, open this link:' },
    reset: { subject: 'Vimla — reset your password', introduction: 'To reset your Vimla password, open this link:' }
  },
  'zh-CN': {
    verify: { subject: 'Vimla — 验证电子邮箱', introduction: '请打开以下链接验证您的 Vimla 邮箱：' },
    reset: { subject: 'Vimla — 重置密码', introduction: '请打开以下链接重置您的 Vimla 密码：' }
  },
  ja: {
    verify: { subject: 'Vimla — メールアドレスの確認', introduction: 'Vimla のメールアドレスを確認するには、次のリンクを開いてください：' },
    reset: { subject: 'Vimla — パスワードの再設定', introduction: 'Vimla のパスワードを再設定するには、次のリンクを開いてください：' }
  },
  'sv-SE': {
    verify: { subject: 'Vimla — bekräfta din e-postadress', introduction: 'Öppna följande länk för att bekräfta din e-postadress i Vimla:' },
    reset: { subject: 'Vimla — återställ lösenord', introduction: 'Öppna följande länk för att återställa ditt Vimla-lösenord:' }
  }
};

export function getMailLocale(request?: Request): MailLocale {
  const cookie = request?.headers.get('cookie') ?? '';
  const saved = cookie.match(/(?:^|;\s*)vimla-locale=([^;]+)/)?.[1];
  const lang = saved ? decodeURIComponent(saved) : (request?.headers.get('accept-language') ?? 'ru');
  if (lang.startsWith('zh')) return 'zh-CN';
  if (lang.startsWith('sv')) return 'sv-SE';
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('en')) return 'en';
  return 'ru';
}

export async function sendTransactionalMail(args: { to: string; url: string; kind: MailKind; locale: MailLocale }): Promise<void> {
  const conf = copy[args.locale][args.kind];
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT!),
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: process.env.NODE_ENV === 'production' && process.env.SMTP_SECURE !== 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASSWORD! } : undefined,
    connectionTimeout: 10000,
    socketTimeout: 12000
  });
  // No secret token/link is ever written to logs.
  await transporter.sendMail({
    from: process.env.SMTP_FROM!,
    to: args.to,
    subject: conf.subject,
    text: \`\${conf.introduction}\n\n\${args.url}\n\nVimla\`
  });
}
