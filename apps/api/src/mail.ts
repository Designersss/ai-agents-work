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

function createTransporter(timeoutMillis: number) {
  const secure = process.env.SMTP_SECURE === 'true';
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT!),
    secure,
    // No implicit plaintext fallback on authenticated SMTP transports.
    requireTLS: !secure && process.env.SMTP_HOST !== 'localhost',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD! }
      : undefined,
    connectionTimeout: timeoutMillis,
    greetingTimeout: timeoutMillis,
    socketTimeout: timeoutMillis,
    tls: { minVersion: 'TLSv1.2' }
  });
}

export async function verifyMailTransport(): Promise<void> {
  const transporter = createTransporter(7000);
  try {
    await transporter.verify();
  } finally {
    transporter.close();
  }
}

function htmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char] ?? char);
}

export async function sendTransactionalMail(args: {
  to: string;
  url: string;
  kind: MailKind;
  locale: MailLocale;
}): Promise<void> {
  const conf = copy[args.locale][args.kind];
  const transporter = createTransporter(12000);
  const url = new URL(args.url);
  if (!['https:', 'http:'].includes(url.protocol)) {
    throw new Error('Invalid authentication email URL protocol');
  }
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new Error('Authentication email links must use HTTPS in production');
  }

  const escapedUrl = htmlEscape(url.toString());
  const escapedSubject = htmlEscape(conf.subject);
  const escapedIntro = htmlEscape(conf.introduction);
  const html = `<!doctype html>
<html lang="${htmlEscape(args.locale)}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 18px;background:#f6f7f9;color:#202124;font:14px/1.6 Arial,sans-serif">
  <div style="max-width:540px;margin:0 auto;padding:30px 28px;background:#ffffff;border:1px solid #e7e9ed;border-radius:12px">
    <strong style="font-size:23px;letter-spacing:-.5px">Vimla</strong>
    <h1 style="font-size:20px;font-weight:600;line-height:1.3;margin:24px 0 12px">${escapedSubject}</h1>
    <p style="margin:0 0 22px;color:#555">${escapedIntro}</p>
    <a href="${escapedUrl}" style="display:inline-block;background:#307cf6;color:white;text-decoration:none;border-radius:7px;padding:11px 18px;font-weight:600">Vimla</a>
    <p style="margin:24px 0 8px;font-size:12px;color:#666;overflow-wrap:anywhere">${escapedUrl}</p>
  </div>
</body></html>`;

  try {
    // No auth token, password, email body or link is written into application logs.
    await transporter.sendMail({
      from: process.env.SMTP_FROM!,
      to: args.to,
      subject: conf.subject,
      text: `${conf.introduction}\n\n${url.toString()}\n\nVimla`,
      html
    });
  } finally {
    transporter.close();
  }
}
