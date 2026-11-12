import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, BookOpen, MessageSquare, Workflow } from 'lucide-react';
import { Brand, Preferences } from '../components/brand-chrome';
import { Button } from '../components/ui/button';

export default async function Home() {
  const t = await getTranslations('Landing');

  return <div className="landing">
    <header className="landing-header">
      <div className="landing-header-content">
        <Brand/>
        <nav className="landing-nav" aria-label={t('navigation')}>
          <Link href="#about">{t('about')}</Link>
          <Link href="#knowledge">{t('knowledge')}</Link>
          <Link href="/sign-in">{t('login')}</Link>
          <Button size="sm" asChild><Link href="/sign-up">{t('register')}</Link></Button>
        </nav>
        <Preferences/>
      </div>
    </header>
    <main className="landing-main">
      <section className="landing-hero" aria-labelledby="landing-title">
        <p className="landing-eyebrow">Vimla / AI</p>
        <h1 id="landing-title">{t('title')}</h1>
        <p className="landing-lead">{t('description')}</p>
        <div className="landing-actions">
          <Button asChild><Link href="/sign-up">{t('register')} <ArrowRight size={17} aria-hidden="true"/></Link></Button>
          <Button variant="outline" asChild><Link href="/sign-in">{t('login')}</Link></Button>
        </div>
      </section>
      <section id="about" className="landing-section" aria-labelledby="about-title">
        <p className="landing-section-label">{t('about')}</p>
        <h2 id="about-title">{t('aboutTitle')}</h2>
        <p>{t('aboutText')}</p>
        <div className="landing-features">
          <span><Workflow size={17} aria-hidden="true"/>{t('agents')}</span>
          <span><MessageSquare size={17} aria-hidden="true"/>{t('messages')}</span>
          <span><BookOpen size={17} aria-hidden="true"/>{t('knowledge')}</span>
        </div>
      </section>
      <section id="knowledge" className="landing-section" aria-labelledby="knowledge-title">
        <p className="landing-section-label">{t('knowledge')}</p>
        <h2 id="knowledge-title">{t('knowledgeTitle')}</h2>
        <p>{t('knowledgeText')}</p>
      </section>
    </main>
    <footer className="landing-footer">© Vimla</footer>
  </div>;
}
