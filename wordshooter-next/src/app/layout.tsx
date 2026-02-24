import type { Metadata, Viewport } from 'next';
import { pressStart2P } from './fonts';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://wordshooter.vercel.app'),
  title: 'Word Shooter',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>",
    apple: [
      { url: '/apple-touch-icon.png' },
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  openGraph: {
    title: '🚀 Word Shooter',
    images: [{ url: '/og-image.png' }],
    url: 'https://wordshooter.vercel.app/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🚀 Word Shooter',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className={pressStart2P.variable}>
        {children}
      </body>
    </html>
  );
}
