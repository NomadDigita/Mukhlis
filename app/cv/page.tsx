'use client';

import { useEffect, useState } from 'react';

type Locale = 'en' | 'ar';
const cvCopy = {
  en: {
    back: 'Back to portfolio', download: 'Print / save as PDF', label: 'CURRICULUM VITAE', role: 'Arabic educator · voice artist', location: 'Nigeria', profileTitle: 'Profile',
    profile: 'Arabic and Islamic Studies educator with experience teaching since 2021. Focused on clear expression, accurate pronunciation, attentive listening, and accessible learning.',
    experience: 'Teaching experience', current: 'Arabic & Islamic Studies Educator', currentOrg: 'Institution of Al-Adeeby · 2023 — Present', prev1: 'Arabic & Islamic Studies Teacher', org1: 'Mahd Ahlu Sunnah, Iwo · 2022 — 2023', prev2: 'Arabic Teacher', org2: 'Mahd Arobiyy, Ibadan · 2021 — 2022',
    education: 'Education', degree: 'B.Sc. Arabic and Islamic Studies', school: 'Ahmadu Bello University · Zaria, Nigeria', focus: 'Focus areas', skills: 'Arabic instruction · pronunciation and recitation · spoken Arabic · narration · classroom teaching', contact: 'Contact', saveHint: 'Choose “Save as PDF” in your browser print dialog.',
  },
  ar: {
    back: 'العودة إلى الموقع', download: 'طباعة / حفظ بصيغة PDF', label: 'السيرة الذاتية', role: 'معلّم لغة عربية · فنان صوتي', location: 'نيجيريا', profileTitle: 'نبذة',
    profile: 'معلّم للغة العربية والدراسات الإسلامية، لديه خبرة في التدريس منذ عام ٢٠٢١. يهتم بوضوح التعبير وسلامة النطق وحسن الاستماع وتيسير التعلّم.',
    experience: 'الخبرة التعليمية', current: 'معلّم اللغة العربية والدراسات الإسلامية', currentOrg: 'مؤسسة الأديبي · ٢٠٢٣ — الآن', prev1: 'معلّم اللغة العربية والدراسات الإسلامية', org1: 'معهد أهل السنة، إيوو · ٢٠٢٢ — ٢٠٢٣', prev2: 'معلّم اللغة العربية', org2: 'معهد العربية، إبادن · ٢٠٢١ — ٢٠٢٢',
    education: 'التعليم', degree: 'بكالوريوس اللغة العربية والدراسات الإسلامية', school: 'جامعة أحمدو بيلو · زاريا، نيجيريا', focus: 'مجالات العمل', skills: 'تعليم العربية · النطق والتلاوة · المحادثة العربية · التعليق الصوتي · التدريس', contact: 'التواصل', saveHint: 'اختر «حفظ بصيغة PDF» من نافذة الطباعة.',
  },
} satisfies Record<Locale, Record<string, string>>;

export default function CvPage() {
  const [locale, setLocale] = useState<Locale>('en');
  const t = cvCopy[locale];
  useEffect(() => {
    const saved = window.localStorage.getItem('mukhlis-locale');
    if (saved === 'ar' || saved === 'en') setLocale(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    window.localStorage.setItem('mukhlis-locale', locale);
  }, [locale]);

  return <main className="cv-page" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <div className="cv-toolbar"><a href="/">← {t.back}</a><div><button className="cv-locale" onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}>{locale === 'en' ? 'العربية' : 'English'}</button><button className="cv-print" onClick={() => window.print()}>{t.download}<span aria-hidden="true"> ↓</span></button></div></div>
    <article className="cv-sheet">
      <header className="cv-header"><div><p className="eyebrow">{t.label}</p><h1>Mukhlis<br/><em>Muhammad Jamiu</em></h1><p className="cv-role">{t.role} <span>·</span> {t.location}</p></div><div className="cv-monogram" aria-hidden="true">م</div></header>
      <div className="cv-contact"><a href="mailto:institutionofaladeeby@gmail.com">institutionofaladeeby@gmail.com</a><a href="tel:+2347058572466">+234 705 857 2466</a></div>
      <section className="cv-section"><h2>{t.profileTitle}</h2><p>{t.profile}</p></section>
      <section className="cv-section"><h2>{t.experience}</h2><div className="cv-entry"><h3>{t.current}</h3><p>{t.currentOrg}</p></div><div className="cv-entry"><h3>{t.prev1}</h3><p>{t.org1}</p></div><div className="cv-entry"><h3>{t.prev2}</h3><p>{t.org2}</p></div></section>
      <section className="cv-section"><h2>{t.education}</h2><div className="cv-entry"><h3>{t.degree}</h3><p>{t.school}</p></div></section>
      <section className="cv-section"><h2>{t.focus}</h2><p>{t.skills}</p></section>
      <section className="cv-section cv-contact-block"><h2>{t.contact}</h2><p><a href="mailto:institutionofaladeeby@gmail.com">institutionofaladeeby@gmail.com</a> · <a href="tel:+2347058572466">+234 705 857 2466</a></p></section>
      <p className="cv-save-hint">{t.saveHint}</p>
    </article>
  </main>;
}
