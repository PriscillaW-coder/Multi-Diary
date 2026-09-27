import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthModal } from './components/AuthModal';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { DiaryList } from './components/DiaryList';
import { DiaryEditor } from './components/DiaryEditor';
import { DiaryDetailModal } from './components/DiaryDetailModal';
import { CalendarView } from './components/CalendarView';
import { TimelineView } from './components/TimelineView';
import { MemoriesGallery } from './components/MemoriesGallery';
import { VoiceDiaryHub } from './components/VoiceDiaryHub';
import { MoodAnalytics } from './components/MoodAnalytics';
import { AIInsightsHub } from './components/AIInsightsHub';
import { RemindersView } from './components/RemindersView';
import { SettingsView } from './components/SettingsView';
import type { DiaryEntry, MoodType, VoiceAttachment } from './types/diary';
import { BookOpen, Sparkles, Heart, Shield, Lock, ArrowRight, Loader2 } from 'lucide-react';

function MainApp() {
  const { user, isLoading } = useAuth();

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Diary Editor state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [newEntryDate, setNewEntryDate] = useState<string | undefined>(undefined);
  const [newEntryMood, setNewEntryMood] = useState<MoodType | undefined>(undefined);
  const [newEntryRating, setNewEntryRating] = useState<number | undefined>(undefined);

  // Detail Modal state
  const [detailEntry, setDetailEntry] = useState<DiaryEntry | null>(null);

  // Auth modal open state when user is guest
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-serif font-medium">Entering your private sanctuary...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> Clean welcoming landing screen + modal
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50/30 to-amber-50/40 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 flex flex-col justify-between p-6 antialiased">
        <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 to-amber-300 text-white flex items-center justify-center shadow-md shadow-rose-200 dark:shadow-none">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg font-serif">Multi Diary</span>
              <span className="text-[11px] text-stone-400 block -mt-1">Private Digital Journal & AI Companion</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}
              className="text-xs font-semibold px-4 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-white/80 dark:hover:bg-stone-800 transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setShowAuthModal(true);
              }}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200 dark:shadow-none transition cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </header>

        <main className="max-w-4xl w-full mx-auto text-center py-16 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100/80 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Digital Diary • Mood Tracker • Memory Timeline • AI Reflections</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold font-serif tracking-tight text-stone-900 dark:text-stone-50 leading-tight">
            A quiet sanctuary for your daily life, emotions, and memories.
          </h1>

          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto font-light leading-relaxed">
            Record in rich text, voice diaries, photos, and music of the day. Uncover gentle emotional patterns and receive warm, thoughtful AI reflections designed just for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setShowAuthModal(true);
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold text-sm shadow-xl shadow-rose-200 dark:shadow-none transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Begin Your Mindful Diary</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-sm hover:border-rose-400 transition cursor-pointer"
            >
              <span>Sign In with Demo Account</span>
            </button>
          </div>

          {/* Value Props Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
            <div className="p-6 rounded-3xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm font-serif">Emotion & Mood Tracker</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Track 1–5 star daily ratings and multi-emotion tags with longitudinal mood trends and positive balance ratios.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm font-serif">Empathetic AI Companion</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Receive non-diagnostic empathetic reflections, personalized prompts, speech transcription, and annual reviews.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm font-serif">Zero-Exposure Privacy</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Per-user cryptographic data isolation with comprehensive granular toggles to disable AI diary analysis at any time.
              </p>
            </div>
          </div>
        </main>

        <footer className="text-center py-4 text-xs text-stone-400 border-t border-stone-200/60 dark:border-stone-800/60">
          Multi Diary © 2026. Private & securely encrypted.
        </footer>

        <AuthModal
          isOpen={showAuthModal}
          defaultMode={authMode}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    );
  }

  // Handle New Entry initiation
  const handleOpenNewEntry = (date?: string, initialMood?: MoodType, initialRating?: number) => {
    setEditingEntry(null);
    setNewEntryDate(date);
    setNewEntryMood(initialMood);
    setNewEntryRating(initialRating);
    setIsEditing(true);
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setDetailEntry(null);
    setIsEditing(true);
  };

  const handleTurnVoiceIntoEntry = (voiceAttachment: VoiceAttachment) => {
    const entryTemplate: Partial<DiaryEntry> = {
      title: 'Voice Diary Reflection',
      content: voiceAttachment.transcript ? `<p>“${voiceAttachment.transcript}”</p>` : '<p></p>',
      plainTextContent: voiceAttachment.transcript || '',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      rating: 4,
      mood: 'Calm',
      emotions: ['Calm'],
      voiceRecording: voiceAttachment,
    };
    setEditingEntry(entryTemplate as DiaryEntry);
    setIsEditing(true);
  };

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onNewEntry={() => handleOpenNewEntry()}
    >
      {/* If in edit/create mode */}
      {isEditing ? (
        <div className="py-4">
          <DiaryEditor
            initialEntry={editingEntry}
            initialDate={newEntryDate}
            onSave={saved => {
              setIsEditing(false);
              setEditingEntry(null);
              setDetailEntry(saved);
            }}
            onCancel={() => {
              setIsEditing(false);
              setEditingEntry(null);
            }}
          />
        </div>
      ) : (
        <>
          {/* Tab Views */}
          {currentTab === 'dashboard' && (
            <Dashboard
              onNewEntry={(date, mood, rating) => handleOpenNewEntry(date, mood, rating)}
              onOpenEntry={setDetailEntry}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'diary' && (
            <DiaryList
              onNewEntry={() => handleOpenNewEntry()}
              onOpenEntry={setDetailEntry}
              onEditEntry={handleEditEntry}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              onNewEntryForDate={dateStr => handleOpenNewEntry(dateStr)}
              onOpenEntry={setDetailEntry}
            />
          )}

          {currentTab === 'timeline' && (
            <TimelineView onOpenEntry={setDetailEntry} />
          )}

          {currentTab === 'memories' && (
            <MemoriesGallery onOpenEntry={setDetailEntry} />
          )}

          {currentTab === 'voice' && (
            <VoiceDiaryHub
              onTurnIntoEntry={handleTurnVoiceIntoEntry}
              onOpenEntry={setDetailEntry}
            />
          )}

          {currentTab === 'mood' && <MoodAnalytics />}

          {currentTab === 'insights' && <AIInsightsHub />}

          {currentTab === 'reminders' && <RemindersView />}

          {currentTab === 'settings' && <SettingsView />}
        </>
      )}

      {/* Diary Entry Detail Modal */}
      {detailEntry && (
        <DiaryDetailModal
          entry={detailEntry}
          isOpen={true}
          onClose={() => setDetailEntry(null)}
          onEdit={handleEditEntry}
          onDelete={() => setDetailEntry(null)}
          onDuplicate={() => {}}
          onArchiveToggle={updated => setDetailEntry(updated)}
        />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
