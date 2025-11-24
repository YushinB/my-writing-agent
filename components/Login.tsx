
import React, { useState } from 'react';
import { Mail, Lock, PenLine, ArrowRight, User as UserIcon, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Mock Login Logic
    setTimeout(() => {
      if (email && password) {
        onLogin(email);
      } else {
        setError('Please enter a valid email and password');
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleAutoLogin = (role: 'user' | 'admin') => {
    const dummyEmail = role === 'admin' ? 'admin@prosepolish.com' : 'writer@prosepolish.com';
    setEmail(dummyEmail);
    setPassword('password123');
    setError('');
    setIsLoading(true);

    setTimeout(() => {
        onLogin(dummyEmail);
    }, 800);
  };

  return (
    <div className="min-h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-brand-600 rounded-2xl text-white shadow-xl shadow-brand-500/20 mb-4">
            <PenLine size={32} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">ProsePolish</h1>
          <p className="text-slate-500 dark:text-slate-400">Sign in to continue your writing journey</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          
          {/* Quick Login Section */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 text-center">Test Accounts</p>
            <div className="grid grid-cols-2 gap-3">
                <button
                type="button"
                onClick={() => handleAutoLogin('user')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-brand-200 dark:hover:border-brand-800 transition-all gap-2 group"
                >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full group-hover:scale-110 transition-transform">
                    <UserIcon size={20} />
                </div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300">Writer Demo</div>
                </button>

                <button
                type="button"
                onClick={() => handleAutoLogin('admin')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-purple-200 dark:hover:border-purple-800 transition-all gap-2 group"
                >
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full group-hover:scale-110 transition-transform">
                    <ShieldCheck size={20} />
                </div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300">Admin Demo</div>
                </button>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">Or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
