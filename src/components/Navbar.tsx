'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Ticket,
  Lightbulb,
  LayoutDashboard,
  Crown,
  PlusCircle,
  Users,
  ShieldCheck,
  LogOut,
  LogIn,
  Menu,
  X,
  Bell,
  CheckCheck,
  MessageSquare,
  AlertCircle,
  Clock,
  UserCheck,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { currentUser, isAuthenticated, logout, getAuthHeaders } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifOpen, setNotifOpen] = useState<boolean>(false);

  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch('/api/v1/notifications', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentUser]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/v1/notifications/read-all', {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      fetchNotifications();
    } catch (e) {
      console.error('Mark all read failed:', e);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    try {
      await fetch(`/api/v1/notifications/${notif.id}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      fetchNotifications();
    } catch (e) {
      console.error('Mark read failed:', e);
    }
    setNotifOpen(false);
  };

  const navLinks: { href: string; label: string; icon: any }[] = [];

  if (isAuthenticated && currentUser) {
    navLinks.push(
      { href: '/', label: 'Overview', icon: LayoutDashboard },
      { href: '/tickets', label: 'Tickets', icon: Ticket },
      { href: '/recommendations', label: 'Suggestions', icon: Lightbulb }
    );

    if (currentUser.role === 'IT_SOFTWARE') {
      navLinks.push({ href: '/team', label: 'Work Desk', icon: Users });
    } else if (currentUser.role === 'MANAGER' || currentUser.role === 'SUPER_ADMIN') {
      navLinks.push({ href: '/team', label: 'Teams', icon: Users });
    }

    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'MANAGER') {
      navLinks.push({ href: '/admin', label: 'Admin', icon: Crown });
    }
  }

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-16 gap-4 sm:gap-6">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d97d20] via-[#c16d18] to-[#994d07] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-[#c16d18]/20 group-hover:scale-105 transition-transform duration-200">
              <Ticket className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight flex items-center gap-1">
                BetelTicket
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) - Authenticated Only */}
          {isAuthenticated && currentUser && navLinks.length > 0 && (
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/60">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all duration-200 ${isActive
                      ? 'bg-white text-[#c16d18] shadow-2xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#c16d18]' : 'text-slate-400'}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated && currentUser && (
              <>
                <Link
                  href="/recommendations"
                  className="hidden xl:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-amber-300/80 bg-amber-50/70 text-amber-900 hover:bg-amber-100/80 text-[11px] font-bold transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-[#c16d18]" />
                  <span>Suggest Feature</span>
                </Link>

                <Link
                  href="/tickets/new"
                  className="hidden sm:flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white text-[11px] font-extrabold shadow-md shadow-[#c16d18]/20 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Raise Ticket</span>
                </Link>
              </>
            )}

            {/* Notification Bell Dropdown */}
            {isAuthenticated && currentUser && (
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#c16d18]" />
                        <span className="font-extrabold text-xs text-slate-900">Notifications & Alerts</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-red-100 text-red-700 rounded-full">
                            {unreadCount} Unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            href={n.link || '/'}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors block text-xs ${!n.isRead ? 'bg-amber-50/50 font-bold' : ''
                              }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {n.type === 'COMMENT' && <MessageSquare className="w-4 h-4 text-blue-600" />}
                              {n.type === 'NEED_INFO' && <AlertCircle className="w-4 h-4 text-amber-600" />}
                              {n.type === 'STATUS_CHANGE' && <Clock className="w-4 h-4 text-emerald-600" />}
                              {n.type === 'ASSIGNMENT' && <UserCheck className="w-4 h-4 text-purple-600" />}
                            </div>
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <p className="font-extrabold text-slate-900 truncate">{n.title}</p>
                              <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{n.message}</p>
                              <p className="text-[9px] text-slate-400 font-medium">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Avatar / Auth Actions */}
            <div className="pl-2.5 border-l border-slate-200 flex items-center gap-2">
              {isAuthenticated && currentUser ? (
                <>
                  <Link
                    href="/profile"
                    title="View & Edit Profile"
                    className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl px-2.5 py-1 transition-all group"
                  >
                    <img
                      src={currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=c16d18&color=fff`}
                      alt={currentUser.name}
                      className="w-6 h-6 rounded-full ring-2 ring-[#c16d18]/40 object-cover shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="text-left hidden md:block">
                      <p className="text-[11px] font-extrabold text-slate-800 leading-tight max-w-[100px] truncate group-hover:text-[#c16d18] transition-colors">{currentUser.name}</p>
                      <p className="text-[9px] font-black text-[#c16d18] flex items-center gap-0.5 uppercase tracking-wider">
                        <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                        <span>{currentUser.role.replace('_', ' ')}</span>
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#c16d18]" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Mobile Menu Button - Authenticated Only */}
              {isAuthenticated && currentUser && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer - Authenticated Only */}
        {isAuthenticated && currentUser && mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-2">
            <div className="grid grid-cols-1 gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive
                      ? 'bg-[#c16d18]/10 text-[#c16d18]'
                      : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 flex flex-col gap-2 border-t border-slate-100">
              <Link
                href="/recommendations"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl border border-amber-300/80 bg-amber-50/80 text-amber-900 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Lightbulb className="w-4 h-4 text-[#c16d18]" />
                <span>Suggest Feature</span>
              </Link>
              <Link
                href="/tickets/new"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#c16d18] text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Raise Ticket</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
