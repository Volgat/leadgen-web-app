import './globals.css'

export const metadata = {
  title: 'Business Intelligence Lead Generator',
  description: 'AI-powered lead generation with intent signals from 9 data sources',
  keywords: 'business intelligence, lead generation, AI, data analysis',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}