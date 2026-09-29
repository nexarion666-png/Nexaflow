import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'NexaFlow — ZIP to GitHub',
  description: 'Upload a ZIP project and push it to GitHub.'
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
