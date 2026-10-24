import type { Metadata, Viewport } from 'next'
import { Montserrat, Permanent_Marker } from 'next/font/google'
import './globals.css'

// Mont is the brand face (commercial licence). Montserrat stands in until it is supplied.
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', display: 'swap' })
// The hand-lettered notes ("Juice hits different!").
const marker = Permanent_Marker({ subsets: ['latin'], weight: '400', variable: '--font-marker-face', display: 'swap' })

export const metadata: Metadata = {
  title: 'RUS RUSS Juices · UK’s Juice Brand',
  description: 'RUS RUSS Juices. UK’s Juice Brand. Good drinks, good days.',
  openGraph: {
    title: 'RUS RUSS Juices',
    description: 'Good drinks, good days.',
    type: 'website',
    locale: 'en_GB',
  },
}

export const viewport: Viewport = {
  themeColor: '#f3f8fd',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${montserrat.variable} ${marker.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks that script is running, so CSS can hold the hero back for its entrance. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
