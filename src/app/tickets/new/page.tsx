'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Ticket as TicketIcon,
  UploadCloud,
  FileText,
  X,
  ArrowLeft,
} from 'lucide-react';

export default function NewTicketPage() {
  const router = useRouter();
  const { currentUser, getAuthHeaders } = useAuth();

  const [title, setTitle] = useState('');
  const [websiteName, setWebsiteName] = useState('');
  const [module, setModule] = useState('');
  const [category, setCategory] = useState('Software Bug');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [websites, setWebsites] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/v1/config/options', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.websites && data.websites.length > 0) {
          setWebsites(data.websites);
          setWebsiteName(data.websites[0].name);
        }
        if (data.modules && data.modules.length > 0) {
          setModules(data.modules);
          setModule(data.modules[0].name);
        }
      })
      .catch((err) => console.error('Failed to load target options:', err));
  }, []);

  // Attachment state
  const [attachments, setAttachments] = useState<
    { fileName: string; fileUrl: string; fileType: string; fileSize: number }[]
  >([
    // {
    //   fileName: 'error_screenshot_log.png',
    //   fileUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600',
    //   fileType: 'image/png',
    //   fileSize: 342000,
    // },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || attachments.length >= 5) {
      setError('Attachments must be 5 MB or smaller, with a maximum of 5 files.');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain'].includes(file.type)) {
      setError('Unsupported attachment type.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachments((prev) => [
        ...prev,
        {
          fileName: file.name,
          fileUrl: event.target?.result as string,
          fileType: file.type || 'image/png',
          fileSize: file.size,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          title,
          description,
          websiteName,
          module,
          category,
          priority,
          createdById: currentUser?.id,
          attachments,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit ticket.');
      }

      router.push(`/tickets/${data.ticket.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating ticket.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Tickets Desk</span>
      </button>

      <div className="bg-gradient-to-r from-[#c16d18] to-[#d97d20] text-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="bg-white/20 text-white border border-white/30 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
            Submit Support Request
          </span>
          <span className="text-xs text-amber-100">Sent directly to Manager Inbox in Database</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight">Raise a New Support Ticket</h1>
        <p className="text-xs text-slate-300">
          Provide details, website target, module name, and screenshots for rapid technical investigation.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Ticket Title / Brief Summary <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Stripe checkout 504 gateway timeout error during flash sale"
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c16d18] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Select Project / URL <span className="text-rose-500">*</span>
              </label>
              <select
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c16d18] focus:bg-white focus:outline-none font-bold text-slate-800"
              >
                {websites.map((w: any) => (
                  <option key={w.id} value={w.name}>
                    {w.name} {w.url ? `(${w.url})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Predefined by Manager & Super Admin</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Select Module <span className="text-rose-500">*</span>
              </label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c16d18] focus:bg-white focus:outline-none font-bold text-slate-800"
              >
                {modules.map((m: any) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Predefined by Manager & Super Admin</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Ticket Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c16d18] focus:bg-white focus:outline-none font-semibold text-slate-800"
              >
                <option value="Software Bug">Software Bug</option>
                <option value="IT Request">IT Support Request</option>
                <option value="Infrastructure">Infrastructure Maintenance</option>
                <option value="Feature Access">Feature Access / Permission</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Urgency / Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c16d18] focus:bg-white focus:outline-none font-semibold text-slate-800"
              >
                <option value="LOW">Low - General query</option>
                <option value="MEDIUM">Medium - Normal operational request</option>
                <option value="HIGH">High - Important feature blocking</option>
                <option value="URGENT">Urgent - System outage / Critical bug</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              Detailed Description & Steps to Reproduce <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#c16d18] focus:bg-white focus:outline-none"
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-slate-700">
              Upload Diagnostic Attachments & Screenshots
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-amber-50/40 hover:border-[#c16d18]/50 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept="image/*,.pdf,.doc,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-8 h-8 text-[#c16d18] mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">
                Click to browse or drag & drop diagnostic screenshot
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG, WEBP, PDF up to 10MB</p>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-bold text-slate-600">Attached Files ({attachments.length}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {att.fileType.startsWith('image/') ? (
                          <img src={att.fileUrl} alt={att.fileName} className="w-8 h-8 rounded object-cover shrink-0" />
                        ) : (
                          <FileText className="w-6 h-6 text-[#c16d18] shrink-0" />
                        )}
                        <div className="truncate text-left">
                          <p className="text-xs font-bold text-slate-800 truncate">{att.fileName}</p>
                          <p className="text-[10px] text-slate-400">{(att.fileSize / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#c16d18] hover:bg-[#a35810] text-white text-xs font-bold shadow-md shadow-[#c16d18]/25 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>Submitting Ticket...</span>
            ) : (
              <>
                <TicketIcon className="w-4 h-4" />
                <span>Submit Ticket for Manager Review</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
