// src/app/layout.tsx - UPDATED VERSION
import { Providers } from './providers'
import ConditionalNavbar from '@/components/landing/ConditionalNavbar'

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
          <ConditionalNavbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}