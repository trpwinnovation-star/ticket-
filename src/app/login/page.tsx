'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  Lock,
  Mail,
  User as UserIcon,
  Briefcase,
  ArrowRight,
} from 'lucide-react';

export default function LoginPage() {
  const { login, signup, isAuthenticated } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(name, email, password, 'GUEST_USER', jobTitle);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      {/* Header Badge */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#c16d18] text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-[#c16d18]/30 mb-3">
          <Ticket className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {mode === 'login' ? 'Welcome Back to BetelTicket' : 'Create Your Account'}
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          {mode === 'login'
            ? 'Sign in to access your dashboard, tickets, and recommendations'
            : 'Register to submit support tickets and suggest portal feature improvements'}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex bg-slate-200/70 p-1 rounded-xl mb-6 font-semibold text-xs">
        <button
          type="button"
          onClick={() => { setMode('login'); setError(null); }}
          className={`flex-1 py-2.5 rounded-lg transition-all ${mode === 'login' ? 'bg-white text-[#c16d18] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setError(null); }}
          className={`flex-1 py-2.5 rounded-lg transition-all ${mode === 'signup' ? 'bg-white text-[#c16d18] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          Create Account
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40"
            />
          </div>
        </div>

        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Job Title / Company (Optional)</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Client Operations Specialist"
                className="w-full pl-9 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c16d18]/40"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white font-bold text-xs shadow-md shadow-[#c16d18]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In to Dashboard' : 'Complete Registration'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Demo Credentials Quick Login Helper */}
      {/* <div className="mt-8 bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4"> */}
      {/* <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Role Credentials & Quick Sign-In</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Click any demo account below to quickly auto-fill & verify role permissions:
            </p>
          </div>
        </div> */}

      {/* <div className="space-y-2.5"> */}
      {/* Level 1: Guest User */}
      {/* <button
            type="button"
            onClick={async () => {
              setEmail('priya.sharma@acmeretail.com');
              setPassword('password123');
              setMode('login');
              setError(null);
              setLoading(true);
              try {
                await login('priya.sharma@acmeretail.com', 'password123');
                router.push('/');
              } catch (e: any) {
                setError(e.message);
              } finally {
                setLoading(false);
              }
            }}
            className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 transition-all group flex items-center justify-between gap-3"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                  Level 1: GUEST_USER (Normal User)
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200">Priya Sharma</p>
              <p className="text-[11px] text-slate-400 font-mono">priya.sharma@acmeretail.com</p>
            </div>
            <span className="text-[11px] font-extrabold text-[#c16d18] bg-amber-400/10 group-hover:bg-[#c16d18] group-hover:text-white px-2.5 py-1 rounded-lg transition-colors shrink-0">
              Sign In
            </span>
          </button> */}

      {/* Level 2: IT Software Specialist */}
      {/* <button
            type="button"
            onClick={async () => {
              setEmail('aarav.mehta@itcore.io');
              setPassword('password123');
              setMode('login');
              setError(null);
              setLoading(true);
              try {
                await login('aarav.mehta@itcore.io', 'password123');
                router.push('/');
              } catch (e: any) {
                setError(e.message);
              } finally {
                setLoading(false);
              }
            }}
            className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/40 transition-all group flex items-center justify-between gap-3"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/30">
                  Level 2: IT_SOFTWARE (DevOps Staff)
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200">Aarav Mehta</p>
              <p className="text-[11px] text-slate-400 font-mono">aarav.mehta@itcore.io</p>
            </div>
            <span className="text-[11px] font-extrabold text-blue-400 bg-blue-400/10 group-hover:bg-blue-600 group-hover:text-white px-2.5 py-1 rounded-lg transition-colors shrink-0">
              Sign In
            </span>
          </button> */}

      {/* Level 3: Manager / Account Lead */}
      {/* <button
            type="button"
            onClick={async () => {
              setEmail('rajesh.singhania@orglead.com');
              setPassword('password123');
              setMode('login');
              setError(null);
              setLoading(true);
              try {
                await login('rajesh.singhania@orglead.com', 'password123');
                router.push('/');
              } catch (e: any) {
                setError(e.message);
              } finally {
                setLoading(false);
              }
            }}
            className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40 transition-all group flex items-center justify-between gap-3"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  Level 3: MANAGER (Account Lead)
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200">Rajesh Singhania</p>
              <p className="text-[11px] text-slate-400 font-mono">rajesh.singhania@orglead.com</p>
            </div>
            <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-400/10 group-hover:bg-emerald-600 group-hover:text-white px-2.5 py-1 rounded-lg transition-colors shrink-0">
              Sign In
            </span>
          </button> */}

      {/* Level 4: Super Admin */}
      {/* <button
            type="button"
            onClick={async () => {
              setEmail('kavita.reddy@platformglobal.org');
              setPassword('password123');
              setMode('login');
              setError(null);
              setLoading(true);
              try {
                await login('kavita.reddy@platformglobal.org', 'password123');
                router.push('/');
              } catch (e: any) {
                setError(e.message);
              } finally {
                setLoading(false);
              }
            }}
            className="w-full text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/40 transition-all group flex items-center justify-between gap-3"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/30">
                  Level 4: SUPER_ADMIN (Platform Admin)
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200">Kavita Reddy</p>
              <p className="text-[11px] text-slate-400 font-mono">kavita.reddy@platformglobal.org</p>
            </div>
            <span className="text-[11px] font-extrabold text-purple-400 bg-purple-400/10 group-hover:bg-purple-600 group-hover:text-white px-2.5 py-1 rounded-lg transition-colors shrink-0">
              Sign In
            </span>
          </button> */}
      {/* </div> */}
      {/* </div> */}
    </div>
  );
}

