import './style.css';

export const metadata = {
  metadataBase: new URL('https://mukhlis-voice-portfolio.vercel.app'),
  title: 'Mukhlis Muhammad Jamiu — Arabic Educator & Voice Artist',
  description: 'Arabic language education, voice recordings and teaching demonstrations by Mukhlis Muhammad Jamiu.',
  openGraph: {
    title: 'Mukhlis Muhammad Jamiu — Arabic Educator & Voice Artist',
    description: 'Listen to Arabic readings, teaching demonstrations and voice work.',
    type: 'website',
    locale: 'en_NG',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
