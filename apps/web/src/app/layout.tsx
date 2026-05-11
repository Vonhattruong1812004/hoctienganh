import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'EnglishPro Learning',
  description: 'English learning platform with paths, lessons, quizzes, and progress tracking.',
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
        {children}
      </body>
    </html>
  );
}
