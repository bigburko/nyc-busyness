// In src/app/layout.tsx
import { Providers } from './providers' // 👈 Import the new client component

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
        {/*
          Wrap your children with the Providers component.
          Now, ChakraProvider and extendTheme() will only
          be rendered on the client, solving the error.
        */}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}