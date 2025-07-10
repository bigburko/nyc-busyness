import { Html, Head, Main, NextScript } from 'next/document';
import { ColorModeScript } from '@chakra-ui/react';
import theme from '../app/theme'; // adjust if theme is elsewhere

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        {/* ✅ Inject correct Chakra theme mode (e.g. light) before hydration */}
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
