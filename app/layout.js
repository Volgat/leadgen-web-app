import './globals.css'

export const metadata = {
  title: 'Silver Birch Intelligence - B2B Lead Generator',
  description: 'AI-powered lead generation with intent signals from 9 data sources. Automated business intelligence for smarter B2B growth.',
  keywords: 'business intelligence, lead generation, AI, data analysis, B2B, crunchbase, intent signals',
  author: 'Silver Birch Growth Inc.',
}

// Configuration viewport séparée pour Next.js 15
export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-gray-50">
        <div id="__next">
          {children}
        </div>
      </body>
    </html>
  )
}