import "./globals.css";
import { EmotionProvider } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <EmotionProvider>
          {children}
        </EmotionProvider>
      </body>
    </html>
  );
} 