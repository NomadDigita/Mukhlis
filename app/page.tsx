'use client';

import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase, type Work } from '../lib/supabase';

type Locale = 'en' | 'ar';
type Filter = 'all' | 'audio' | 'video';

const copy = {
  en: {
    navWork: 'Selected work', navAbout: 'About', navContact: 'Contact',
    eyebrow: 'ARABIC LANGUAGE · VOICE · EDUCATION',
    titleA: 'Words with', titleB: 'meaning.', titleC: 'Voice with', titleD: 'clarity.',
    intro: "I'm Mukhlis Muhammad Jamiu — an Arabic and Islamic Studies educator based in Nigeria. Explore my spoken Arabic, teaching demonstrations and media work.",
    viewWork: 'Explore recordings', viewCv: 'View my CV', heroNote: 'Arabic teaching · narration · recitation',
    workEyebrow: 'A SMALL SELECTION', workTitle: 'Listen to the work', workLead: 'Recordings and video demonstrations, gathered in one place.',
    all: 'All work', audio: 'Audio', video: 'Video', loading: 'Loading published work…',
    empty: 'The library is being prepared.', emptyFiltered: 'No published work in this category yet.',
    unavailable: 'The media library is temporarily unavailable. Please try again later.',
    aboutEyebrow: 'BACKGROUND', aboutTitle: 'Language is my craft. Teaching is my foundation.',
    aboutText: 'I teach Arabic and Islamic Studies with a focus on accurate pronunciation, clear expression, attentive listening, and meaningful conversation.',
    experience: 'Experience', current: 'Arabic & Islamic Studies educator', currentPlace: 'Institution of Al-Adeeby · 2023 — Present',
    previousOne: 'Arabic & Islamic Studies teacher', previousOnePlace: 'Mahd Ahlu Sunnah, Iwo · 2022 — 2023',
    previousTwo: 'Arabic teacher', previousTwoPlace: 'Mahd Arobiyy, Ibadan · 2021 — 2022',
    education: 'Education', educationDetail: 'B.Sc. Arabic and Islamic Studies · Ahmadu Bello University, Zaria',
    contactEyebrow: 'LET’S WORK TOGETHER', contactTitle: 'Have a project in mind?', contactText: 'For Arabic voice work, teaching, narration, and thoughtful collaborations.',
    contact: 'Send an email', footer: 'Arabic educator and voice artist · Nigeria', admin: 'Studio',
    menu: 'Open navigation', closeMenu: 'Close navigation', language: 'العربية', playerError: 'This recording could not be played.',
    arabicLine: 'العِلْمُ نُورٌ وَاللُّغَةُ جِسْرٌ',
  },
  ar: {
    navWork: 'أعمال مختارة', navAbout: 'نبذة', navContact: 'تواصل',
    eyebrow: 'اللغة العربية · الصوت · التعليم',
    titleA: 'كلماتٌ ذات', titleB: 'معنى.', titleC: 'وصوتٌ', titleD: 'واضح.',
    intro: 'أنا مخلص محمد جامع، معلّم للغة العربية والدراسات الإسلامية من نيجيريا. تفضّلوا بالاستماع إلى قراءاتي وعروض التدريس وأعمالي الصوتية.',
    viewWork: 'استمع إلى الأعمال', viewCv: 'السيرة الذاتية', heroNote: 'تعليم العربية · التعليق الصوتي · التلاوة',
    workEyebrow: 'مختارات من أعمالي', workTitle: 'استمع إلى الأعمال', workLead: 'تسجيلات وعروض مرئية تعليمية في مكان واحد.',
    all: 'كل الأعمال', audio: 'صوت', video: 'فيديو', loading: 'جارٍ تحميل الأعمال المنشورة…',
    empty: 'المكتبة قيد التجهيز.', emptyFiltered: 'لا توجد أعمال منشورة في هذا القسم بعد.',
    unavailable: 'المكتبة غير متاحة مؤقتًا. يرجى المحاولة لاحقًا.',
    aboutEyebrow: 'نبذة', aboutTitle: 'اللغة حِرفتي، والتعليم رسالتي.',
    aboutText: 'أدرّس اللغة العربية والدراسات الإسلامية، مع التركيز على سلامة النطق ووضوح التعبير وحسن الاستماع والحوار الهادف.',
    experience: 'الخبرة', current: 'معلّم اللغة العربية والدراسات الإسلامية', currentPlace: 'مؤسسة الأديبي · ٢٠٢٣ — الآن',
    previousOne: 'معلّم اللغة العربية والدراسات الإسلامية', previousOnePlace: 'معهد أهل السنة، إيوو · ٢٠٢٢ — ٢٠٢٣',
    previousTwo: 'معلّم اللغة العربية', previousTwoPlace: 'معهد العربية، إبادن · ٢٠٢١ — ٢٠٢٢',
    education: 'التعليم', educationDetail: 'بكالوريوس اللغة العربية والدراسات الإسلامية · جامعة أحمدو بيلو، زاريا',
    contactEyebrow: 'لنتعاون', contactTitle: 'هل لديك مشروع؟', contactText: 'للأعمال الصوتية والتعليم والتعليق الصوتي والتعاون الهادف.',
    contact: 'أرسل رسالة', footer: 'معلّم لغة عربية وفنان صوتي · نيجيريا', admin: 'الاستوديو',
    menu: 'فتح القائمة', closeMenu: 'إغلاق القائمة', language: 'English', playerError: 'تعذّر تشغيل هذا التسجيل.',
    arabicLine: 'العِلْمُ نُورٌ وَاللُّغَةُ جِسْرٌ',
  },
} satisfies Record<Locale, Record<string, string>>;

export default function Home() {
  const [locale, setLocale] = useState<Locale>('en');
  const [works, setWorks] = useState<Work[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = copy[locale];
  const rtl = locale === 'ar';

  useEffect(() => {
    const saved = window.localStorage.getItem('mukhlis-locale');
    if (saved === 'ar' || saved === 'en') setLocale(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    window.localStorage.setItem('mukhlis-locale', locale);
  }, [locale]);

  useEffect(() => {
    let active = true;
    async function loadWorks() {
      if (!isSupabaseConfigured) { setLoading(false); return; }
      const { data, error } = await supabase.from('works').select('id,title,description,category,media_type,storage_path,created_at').eq('published', true).order('created_at', { ascending: false });
      if (!active) return;
      if (error) { setFailed(true); setLoading(false); return; }
      const list = (data || []) as Work[];
      setWorks(list);
      const signed = await Promise.all(list.map(async (work) => {
        const { data: urlData } = await supabase.storage.from('portfolio-media').createSignedUrl(work.storage_path, 3600);
        return urlData?.signedUrl ? [work.id, urlData.signedUrl] as const : null;
      }));
      if (!active) return;
      setMediaUrls(Object.fromEntries(signed.filter((item): item is readonly [string, string] => item !== null)));
      setLoading(false);
    }
    loadWorks().catch(() => { if (active) { setFailed(true); setLoading(false); } });
    return () => { active = false; };
  }, []);

  const visibleWorks = works.filter((work) => filter === 'all' || work.media_type === filter);
  function switchLocale() { setLocale((current) => current === 'en' ? 'ar' : 'en'); setMenuOpen(false); }
  function closeMenu() { setMenuOpen(false); }

  return <main className="site" dir={rtl ? 'rtl' : 'ltr'}>
    <header className="site-header">
      <a className="brand" href="#home" aria-label="Mukhlis Muhammad Jamiu home"><span className="brand-mark">م</span><span className="brand-name">MUKHLIS <i>JAMIU</i></span></a>
      <button className="menu-toggle" aria-label={menuOpen ? t.closeMenu : t.menu} aria-expanded={menuOpen} aria-controls="site-nav" onClick={() => setMenuOpen((open) => !open)}><span/><span/></button>
      <nav className={`site-nav${menuOpen ? ' is-open' : ''}`} id="site-nav" aria-label={rtl ? 'التنقل الرئيسي' : 'Main navigation'}>
        <a href="#work" onClick={closeMenu}>{t.navWork}</a><a href="#about" onClick={closeMenu}>{t.navAbout}</a><a href="#contact" onClick={closeMenu}>{t.navContact}</a>
        <button className="language-toggle" onClick={switchLocale} lang={rtl ? 'en' : 'ar'}>{t.language}</button>
      </nav>
    </header>

    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-rule"/>{t.eyebrow}</p>
        <h1 id="hero-title">{t.titleA}<br/><em>{t.titleB}</em><br/>{t.titleC} <em>{t.titleD}</em></h1>
        <p className="hero-intro">{t.intro}</p>
        <div className="hero-actions"><a className="button button-primary" href="#work">{t.viewWork}<span className="arrow-mark" aria-hidden="true"/></a><a className="button button-text" href="/cv">{t.viewCv}<span className="arrow-mark" aria-hidden="true"/></a></div>
      </div>
      <div className="hero-art" aria-hidden="true"><span className="art-orbit orbit-one"/><span className="art-orbit orbit-two"/><span className="art-arabic">م</span><span className="art-caption">{t.heroNote}</span></div>
      <div className="hero-arabic" lang="ar" dir="rtl">{t.arabicLine}</div>
    </section>

    <section className="work-section section-wrap" id="work" aria-labelledby="work-title">
      <div className="section-topline"><p className="eyebrow">{t.workEyebrow}</p><span>01 / 03</span></div>
      <div className="section-heading"><div><h2 id="work-title">{t.workTitle}</h2><p>{t.workLead}</p></div><div className="filters" role="group" aria-label={rtl ? 'تصفية الأعمال' : 'Filter portfolio'}>{(['all', 'audio', 'video'] as Filter[]).map((kind) => <button key={kind} type="button" className={filter === kind ? 'active' : ''} aria-pressed={filter === kind} onClick={() => setFilter(kind)}>{t[kind]}</button>)}</div></div>
      {loading ? <div className="library-state" role="status">{t.loading}</div> : failed ? <div className="library-state" role="status">{t.unavailable}</div> : visibleWorks.length ? <div className="work-grid">{visibleWorks.map((work, index) => <article className="work-card" key={work.id}>
        <div className="work-card-top"><span className="work-index">{String(index + 1).padStart(2, '0')}</span><span className="work-type">{work.media_type === 'audio' ? t.audio : t.video} · {work.category}</span></div>
        <h3>{work.title}</h3>{work.description && <p className="work-description">{work.description}</p>}
        {mediaUrls[work.id] ? work.media_type === 'audio' ? <audio controls preload="none" src={mediaUrls[work.id]} aria-label={`${work.title} audio`}/> : <video controls preload="metadata" src={mediaUrls[work.id]} aria-label={`${work.title} video`}/> : <p className="media-pending" role="status">{t.playerError}</p>}
      </article>)}</div> : <div className="library-state"><span className="empty-mark" aria-hidden="true">م</span><p>{works.length ? t.emptyFiltered : t.empty}</p></div>}
    </section>

    <section className="about-section section-wrap" id="about" aria-labelledby="about-title">
      <div className="section-topline"><p className="eyebrow">{t.aboutEyebrow}</p><span>02 / 03</span></div>
      <div className="about-grid"><div className="about-copy"><h2 id="about-title">{t.aboutTitle}</h2><p>{t.aboutText}</p><div className="about-quote" lang="ar" dir="rtl">{t.arabicLine}</div></div><div className="credentials"><h3>{t.experience}</h3><div className="credential"><b>{t.current}</b><span>{t.currentPlace}</span></div><div className="credential"><b>{t.previousOne}</b><span>{t.previousOnePlace}</span></div><div className="credential"><b>{t.previousTwo}</b><span>{t.previousTwoPlace}</span></div><h3 className="education-heading">{t.education}</h3><div className="credential"><b>{t.educationDetail}</b></div></div></div>
    </section>

    <section className="contact-section section-wrap" id="contact" aria-labelledby="contact-title">
      <div className="section-topline"><p className="eyebrow">{t.contactEyebrow}</p><span>03 / 03</span></div>
      <div className="contact-grid"><h2 id="contact-title">{t.contactTitle}</h2><div><p>{t.contactText}</p><a className="contact-link" href="mailto:institutionofaladeeby@gmail.com">{t.contact}<span className="arrow-mark" aria-hidden="true"/></a><div className="contact-details"><a href="mailto:institutionofaladeeby@gmail.com">institutionofaladeeby@gmail.com</a><a href="tel:+2347058572466">+234 705 857 2466</a></div></div></div>
    </section>

    <footer className="site-footer"><span>© {new Date().getFullYear()} Mukhlis Muhammad Jamiu</span><span>{t.footer}</span><a href="/admin">{t.admin}</a></footer>
  </main>;
}
