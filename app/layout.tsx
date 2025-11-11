import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'AI Video Generator (Google Veo 3.1)',
  description: 'Generate 8K ultra-realistic cinematic videos with Google Veo 3.1',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <header className="app-header">
            <div className="brand">Veo 3.1 ? AI Video Generator</div>
            <div className="header-right">
              <a className="link" href="https://ai.google.dev/" target="_blank" rel="noreferrer">Google AI</a>
            </div>
          </header>
          <main className="app-main">{children}</main>
          <footer className="app-footer">Built for 8K cinematic generation with Veo 3.1</footer>
        </div>
      </body>
    </html>
  );
}
