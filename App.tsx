
import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { WritingStudio } from './components/WritingStudio';
import { AdminDashboard } from './components/AdminDashboard';
import { User, AppSettings } from './types';

function App() {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('pp_user');
    return stored ? JSON.parse(stored) : null;
  });

  // --- App Settings State ---
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = localStorage.getItem('pp_settings');
    return stored ? JSON.parse(stored) : {
      fontFamily: 'inter',
      aiModel: 'gemini-2.5-flash',
      theme: 'light' // default logic will be overridden by effect
    };
  });

  // --- View State ---
  const [currentView, setCurrentView] = useState<'login' | 'writing' | 'admin'>(() => {
    return user ? 'writing' : 'login';
  });

  // Persist Settings
  useEffect(() => {
    localStorage.setItem('pp_settings', JSON.stringify(settings));
  }, [settings]);

  // Apply Theme
  useEffect(() => {
    // If no preference is stored, check system
    const isDark = settings.theme === 'dark' || 
      (settings.theme === undefined && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleLogin = (email: string) => {
    // Mock Authentication Logic
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name: email.split('@')[0],
      role: email.includes('admin') ? 'admin' : 'user'
    };
    
    setUser(newUser);
    localStorage.setItem('pp_user', JSON.stringify(newUser));
    setCurrentView(newUser.role === 'admin' ? 'admin' : 'writing');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pp_user');
    setCurrentView('login');
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleTheme = () => {
    handleUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  // Render Logic
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentView === 'admin' && user.role === 'admin') {
    return (
      <AdminDashboard 
        user={user}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onLogout={handleLogout}
        onBackToApp={() => setCurrentView('writing')}
      />
    );
  }

  return (
    <WritingStudio 
      user={user}
      settings={settings}
      onLogout={handleLogout}
      onOpenAdmin={() => setCurrentView('admin')}
      onToggleTheme={toggleTheme}
    />
  );
}

export default App;
