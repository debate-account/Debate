import './globals.css';
import { SettingsProvider, SettingsButton } from '@/components/Settings';

export const metadata = { title: 'Debate Practice' };

// Apply the saved theme before first paint so dark mode doesn't flash white.
const themeScript = `try{var t=localStorage.getItem('dp.theme')||'light';document.documentElement.dataset.theme=t;}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SettingsProvider>
          {children}
          <SettingsButton />
        </SettingsProvider>
      </body>
    </html>
  );
}
