'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { createAuthClient } from 'better-auth/react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const authClient = createAuthClient({ baseURL: API });

type Workspace = { id: string; name: string; role: string; availableKopecks: number; reservedKopecks: number };
type Answer = { status: string; id: string; answer: string; chargedKopecks: number; inputTokens: number; outputTokens: number };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(API + path, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data && typeof data === 'object' && 'message' in data ? String(data.message) : 'Ошибка сервера';
    throw new Error(detail);
  }
  return data as T;
}

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selected, setSelected] = useState('');
  const [workspaceName, setWorkspaceName] = useState('Моя компания');
  const [prompt, setPrompt] = useState('Здравствуйте! Хочу заказать кухню по индивидуальным размерам.');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadWorkspaces = useCallback(async () => {
    try {
      const items = await request<Workspace[]>('/v1/workspaces');
      setWorkspaces(items);
      setSelected(current => items.some(i => i.id === current) ? current : (items[0]?.id ?? ''));
    } catch (err) { setError(err instanceof Error ? err.message : 'Не удалось загрузить Workspace'); }
  }, []);

  useEffect(() => { if (session?.user) void loadWorkspaces(); else { setWorkspaces([]); setSelected(''); } }, [session?.user?.id, loadWorkspaces]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const result = authMode === 'signup'
        ? await authClient.signUp.email({ name: name.trim(), email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message ?? 'Ошибка входа');
      setNotice('Вход выполнен.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка входа'); }
    finally { setBusy(false); }
  }

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const created = await request<Workspace>('/v1/workspaces', { method: 'POST', body: JSON.stringify({ name: workspaceName }) });
      await loadWorkspaces();
      setSelected(created.id);
      setNotice('Workspace создан. Баланс равен 0 ₽: для проверки используйте локальный CLI тестового кредита.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка создания'); }
    finally { setBusy(false); }
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true); setError(''); setNotice(''); setAnswer(null);
    try {
      const result = await request<Answer>('/v1/agent/ask', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: selected, prompt, idempotencyKey: crypto.randomUUID() }),
      });
      setAnswer(result);
      await loadWorkspaces();
    } catch (err) { setError(err instanceof Error ? err.message : 'Ошибка запроса'); await loadWorkspaces(); }
    finally { setBusy(false); }
  }

  const active = workspaces.find(w => w.id === selected);
  return <main className="shell">
    <header className="topbar"><span className="mark">✦</span><strong>AIMock</strong><span className="tag">Технический прототип 01</span></header>
    <div className="container">
      <section className="intro"><span className="eyebrow">РАБОЧИЙ СЦЕНАРИЙ</span><h1>Проверяем основу платформы</h1>
        <p>Авторизация, изоляция Workspace, настоящий запрос через ProxyAPI и учёт токенов. Здесь нет имитации работы AI.</p></section>
      {error && <div role="alert" className="error">{error}</div>}
      {notice && <div role="status" className="notice">{notice}</div>}
      {isPending ? <p>Проверяем сессию…</p> : !session?.user ? (
        <div className="card auth"><h2>{authMode === 'signup' ? 'Создать аккаунт' : 'Войти в AIMock'}</h2>
          <p className="muted">Только для локальной проверки архитектуры.</p>
          <form onSubmit={submitAuth}>
            {authMode === 'signup' && <label>Имя<input required minLength={2} value={name} onChange={e => setName(e.target.value)} /></label>}
            <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
            <label>Пароль<input type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label>
            <button disabled={busy} type="submit">{authMode === 'signup' ? 'Зарегистрироваться' : 'Войти'}</button>
          </form>
          <button className="text-button" type="button" onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}>{
            authMode === 'signup' ? 'Уже есть аккаунт? Войти' : 'Создать аккаунт'
          }</button>
        </div>
      ) : <div className="grid">
        <aside className="card sidebar">
          <div className="profile"><div className="circle">{session.user.name.slice(0, 1).toUpperCase()}</div>
            <div><strong>{session.user.name}</strong><p className="muted">{session.user.email}</p></div></div>
          <h2>Пространство</h2>
          <label className="sr-only" htmlFor="ws">Выбрать Workspace</label>
          <select id="ws" value={selected} onChange={e => { setSelected(e.target.value); setAnswer(null); }}>
            {!workspaces.length && <option value="">Нет пространств</option>}
            {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          {active && <div className="balances"><span>Доступно</span><strong>{(Number(active.availableKopecks) / 100).toFixed(2)} ₽</strong>
            <span>Зарезервировано</span><strong>{(Number(active.reservedKopecks) / 100).toFixed(2)} ₽</strong>
            <small>ID: {active.id}</small></div>}
          <form onSubmit={createWorkspace} className="create">
            <label>Новое пространство<input minLength={2} maxLength={80} value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} /></label>
            <button type="submit" disabled={busy}>Создать Workspace</button>
          </form>
          <button className="text-button" type="button" onClick={() => void authClient.signOut()}>Выйти</button>
        </aside>
        <section className="card testing"><div className="chat-head"><span className="avatar">✦</span><div><h2>Агент «Заявки»</h2>
          <span className="muted">AI SDK → ProxyAPI · реальный запрос</span></div></div>
          <div className="chat">
            {answer ? <><div className="bubble user">{prompt}</div><div className="bubble bot">{answer.answer}</div></> :
              <div className="empty">Задайте вопрос о заявке.<p>Нужны API-ключ, модель, её тарифы и тестовый баланс. Без них запрос заблокирован.</p></div>}
          </div>
          {answer && <div className="usage">Вход: {answer.inputTokens} токенов · Выход: {answer.outputTokens} · Списано: {(answer.chargedKopecks / 100).toFixed(2)} ₽</div>}
          <form onSubmit={ask} className="compose">
            <label className="sr-only" htmlFor="prompt">Тестовое сообщение</label>
            <textarea id="prompt" required maxLength={2000} value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}/>
            <button disabled={busy || !selected} type="submit">{busy ? 'Обработка…' : 'Отправить агенту'}</button>
          </form>
          <p className="footnote">Действия в CRM не выполняются. При неизвестном результате провайдера резерв сохраняется до сверки.</p>
        </section>
      </div>}
    </div>
  </main>;
}
