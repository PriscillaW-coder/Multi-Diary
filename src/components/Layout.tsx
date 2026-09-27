import React, { useState } from 'react';
import {
  Home,
  BookOpen,
  Calendar,
  Clock,
  Image as ImageIcon,
  Mic,
  Heart,
  Sparkles,
  Bell,
  Settings,
  Plus,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onNewEntry: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  onNewEntry,
  children,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'diary', label: 'My Diary', icon: BookOpen },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'memories', label: 'Memories', icon: ImageIcon },
    { id: 'voice', label: 'Voice Diary', icon: Mic },
    { id: 'mood', label: 'Mood Tracking', icon: Heart },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col md:flex-row antialiased">
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-stone-200/80 dark:border-stone-800 bg-white/70 dark:bg-stone-900/80 backdrop-blur-xl shrink-0 p-5 space-y-6 sticky top-0 h-screen overflow-y-auto">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 to-amber-300 text-white flex items-center justify-center shadow-md shadow-rose-200 dark:shadow-none">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg font-serif tracking-tight block">
              Multi Diary
            </span>
            <span className="text-[11px] text-stone-400 block -mt-1">
              Mindful Sanctuary
            </span>
          </div>
        </div>

        {/* Quick New Entry Button */}
        <button
          type="button"
          onClick={onNewEntry}
          className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium text-xs shadow-md shadow-rose-200 dark:shadow-none transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Diary Entry</span>
        </button>

        {/* Navigation list */}
        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-500' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer profile & controls */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
          <div className="flex items-center justify-between text-xs px-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 flex items-center justify-center text-xs font-bold">
                {user?.name?.slice(0, 1) || 'P'}
              </div>
              <div className="truncate max-w-[120px]">
                <span className="font-semibold block truncate text-stone-800 dark:text-stone-200">
                  {user?.name}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              title="Toggle Dark / Light Mode"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-stone-500 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-3.5 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-400 to-amber-300 text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-bold text-base font-serif">Multi Diary</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-xl text-stone-500"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-xl text-stone-600 dark:text-stone-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu Sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-stone-900/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white dark:bg-stone-900 rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <span className="font-bold text-sm text-stone-800 dark:text-stone-200">
                Menu & Navigation
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNewEntry();
              }}
              className="w-full py-3 rounded-2xl bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Diary Entry</span>
            </button>

            <nav className="grid grid-cols-2 gap-2 pt-2">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-medium border transition ${
                      isActive
                        ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-600'
                        : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-500">{user?.name} ({user?.email})</span>
              <button
                type="button"
                onClick={logout}
                className="text-rose-500 font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto max-w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur-lg border-t border-stone-200 dark:border-stone-800 px-3 py-2 flex items-center justify-around z-30">
        {[
          { id: 'dashboard', label: 'Home', icon: Home },
          { id: 'diary', label: 'Diary', icon: BookOpen },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'timeline', label: 'Timeline', icon: Clock },
          { id: 'memories', label: 'Memories', icon: ImageIcon },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleNavClick(tab.id)}
              className={`flex flex-col items-center gap-1 p-1.5 transition ${
                isActive ? 'text-rose-500 font-bold' : 'text-stone-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onNewEntry}
          className="w-10 h-10 -mt-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-300 dark:shadow-none"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
