'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Ticket } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isLoginPage) {
        router.push('/login');
      } else if (isAuthenticated && isLoginPage) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, isLoginPage, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d97d20] to-[#994d07] text-white flex items-center justify-center font-bold shadow-lg animate-pulse">
          <Ticket className="w-6 h-6 animate-bounce" />
        </div>
        <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">
          Verifying Session...
        </p>
      </div>
    );
  }

  // Prevent flash of protected content while redirecting
  if (!isAuthenticated && !isLoginPage) {
    return null;
  }

  return <>{children}</>;
}
