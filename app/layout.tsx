import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'mplayer',
  description: 'mplayer',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className='dark' style={{ colorScheme: "dark" }}>
      <body>{children}</body>
    </html>
  )
}
