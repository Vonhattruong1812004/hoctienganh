import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { BackNavigationButton } from '../components/back-navigation-button';
import './globals.css';

export const metadata: Metadata = {
  title: 'EnglishPro Learning',
  description: 'English learning platform with paths, lessons, quizzes, and progress tracking.',
  manifest: '/manifest.webmanifest',
  applicationName: 'EnglishPro TOEIC',
  appleWebApp: {
    capable: true,
    title: 'EnglishPro TOEIC',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/pokeball-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/pokeball-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/pokeball-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">{`
          (() => {
            try {
              const key = 'englishpro.theme';
              const stored = window.localStorage.getItem(key);
              const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              const theme = stored === 'light' || stored === 'dark' ? stored : preferred;
              document.documentElement.dataset.theme = theme;
              document.documentElement.style.colorScheme = theme;
            } catch (error) {}
          })();
        `}</Script>
        <BackNavigationButton />
        {children}
      </body>
    </html>
  );
}
