import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'TicketPulse Pro - Enterprise Support & Recommendation Hub',
  description: 'Multi-role ticket raising, approval workflow, IT work hours logger, feature recommendation window, and super admin dashboard.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#f8f8f8] text-slate-900 min-h-screen flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
            <AuthGuard>{children}</AuthGuard>
          </main>
          <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c16d18] inline-block"></span>
                <span className="font-semibold text-slate-700">TicketPulse Pro Enterprise v2.4</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
