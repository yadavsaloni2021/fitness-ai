import type { Metadata, Viewport } from 'next'
import './globals.css'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { TopNav } from '@/components/layout/TopNav'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Live WildFit',
  description: 'Your WILDFIT® cycle companion — instant food lookup for every week.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Live WildFit',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#2D6A4F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('lw-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}else{var mq=window.matchMedia('(prefers-color-scheme: dark)');document.documentElement.setAttribute('data-theme',mq.matches?'dark':'light');}}catch(e){}})();` }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <TopNav />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        <BottomTabBar />
      </body>
    </html>
  )
}
