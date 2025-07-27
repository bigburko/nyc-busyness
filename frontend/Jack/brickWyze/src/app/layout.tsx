// src/app/layout.tsx - CORRECT VERSION
import { Providers } from './providers'
import Navbar from '@/components/landing/Navbar'

// You can keep any metadata exports here, as this is a Server Component
export const metadata = {
  title: 'BrickWyze',
  description: 'Find your perfect NYC neighborhood',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <html lang='en'>
      <body>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}