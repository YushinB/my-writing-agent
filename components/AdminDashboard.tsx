
import React from 'react';
import { AppSettings, User, AppFont, AIModel } from '../types';
import { Type, Check, Monitor, Smartphone, Cpu, Layout, LogOut, ArrowLeft } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onLogout: () => void;
  onBackToApp: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, 
  settings, 
  onUpdateSettings,
  onLogout,
  onBackToApp
}) => {
  const fontOptions: { id: AppFont; name: string; class: string }[] = [
    { id: 'inter', name: 'Inter (Clean)', class: 'font-sans' },
    { id: 'merriweather', name: 'Merriweather (Serif)', class: 'font-serif' },
    { id: 'playfair', name: 'Playfair (Display)', class: 'font-display' },
    { id: 'roboto-mono', name: 'Roboto Mono (Code)', class: 'font-mono' },
  ];

  const modelOptions: { id: AIModel; name: string; desc: string }[] = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Fast, efficient, best for general grammar.' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: 'Slower, but smarter reasoning for complex rewriting.' },
  ];

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold font-serif text-slate-800 dark:text-white">Admin Panel</h2>
          <p className="text-xs text-slate-500 mt-1">v1.0.0</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="px-4 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-lg font-medium flex items-center gap-3">
            <Layout size={20} />
            General Settings
          </div>
          {/* Placeholder for future links */}
          <div className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium flex items-center gap-3 opacity-50 cursor-not-allowed">
            <Monitor size={20} />
            Database
          </div>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between md:justify-end">
          <button onClick={onBackToApp} className="md:hidden p-2">
             <ArrowLeft />
          </button>
          <button 
            onClick={onBackToApp}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium shadow-lg shadow-brand-500/20"
          >
            <ArrowLeft size={16} />
            Back to Writing App
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
          
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Webpage Settings</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage global configurations for the writing assistant interface.</p>
          </div>

          {/* Font Settings */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Type size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Typography</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Choose the primary font for the writing interface.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fontOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onUpdateSettings({ fontFamily: option.id })}
                  className={`
                    relative p-4 rounded-lg border-2 text-left transition-all
                    ${settings.fontFamily === option.id 
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'}
                  `}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{option.name}</span>
                    {settings.fontFamily === option.id && <Check size={18} className="text-brand-600 dark:text-brand-400" />}
                  </div>
                  <p className={`text-2xl text-slate-600 dark:text-slate-400 ${option.class}`}>
                    The quick brown fox jumps over the lazy dog.
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Model Settings */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <Cpu size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Model Configuration</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Select the underlying Gemini model for text analysis.</p>
              </div>
            </div>

            <div className="space-y-4">
              {modelOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onUpdateSettings({ aiModel: option.id })}
                  className={`
                    w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all
                    ${settings.aiModel === option.id 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'}
                  `}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-slate-900 dark:text-white">{option.name}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{option.desc}</span>
                  </div>
                  {settings.aiModel === option.id && (
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
                      ACTIVE
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
