import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Star,
  Image as ImageIcon,
  Mic,
  Music,
  ArrowRight,
  Lightbulb,
  Heart,
  ChevronRight,
  TrendingUp,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { DiaryEntry, AIInsight, MoodType } from '../types/diary';

interface DashboardProps {
  onNewEntry: (date?: string, initialMood?: MoodType, initialRating?: number) => void;
  onOpenEntry: (entry: DiaryEntry) => void;
  onNavigateTab: (tab: string) => void;
}

const MOOD_OPTIONS: Array<{ mood: MoodType; emoji: string; label: string }> = [
  { mood: 'Happy', emoji: '😊', label: 'Happy' },
  { mood: 'Grateful', emoji: '🌸', label: 'Grateful' },
  { mood: 'Calm', emoji: '😌', label: 'Calm' },
  { mood: 'Excited', emoji: '🎉', label: 'Excited' },
  { mood: 'Motivated', emoji: '⚡', label: 'Motivated' },
  { mood: 'Neutral', emoji: '😐', label: 'Neutral' },
  { mood: 'Tired', emoji: '🥱', label: 'Tired' },
  { mood: 'Anxious', emoji: '😟', label: 'Anxious' },
];

export const Dashboard: React.FC<DashboardProps> = ({
  onNewEntry,
  onOpenEntry,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [onThisDayMemories, setOnThisDayMemories] = useState<DiaryEntry[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [todayRating, setTodayRating] = useState<number | null>(null);
  const [todayMood, setTodayMood] = useState<MoodType | null>(null);
  const [showReminderSuggestion, setShowReminderSuggestion] = useState(true);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayFormatted = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    loadAiPrompt();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [entriesRes, onThisDayRes, insightsRes] = await Promise.all([
        api.getEntries({ isArchived: false }),
        api.getOnThisDay(),
        api.getAiInsights(),
      ]);

      setEntries(entriesRes.entries || []);
      setOnThisDayMemories(onThisDayRes.memories || []);
      setInsights(insightsRes.insights || []);

      // Check if entry was written today
      const todayStr = new Date().toISOString().slice(0, 10);
      const todaysEntry = entriesRes.entries?.find(e => e.date === todayStr);
      if (todaysEntry) {
        setTodayRating(todaysEntry.rating);
        setTodayMood(todaysEntry.mood);
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    }
  };

  const loadAiPrompt = async (selectedMood?: string) => {
    setIsLoadingPrompt(true);
    try {
      const res = await api.getAiPrompt(selectedMood || todayMood || undefined);
      setAiPrompt(res.prompt);
    } catch (err) {
      setAiPrompt('What is one small detail from today that brought you a sense of quiet gratitude?');
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  const handleQuickCheckin = (ratingVal: number) => {
    setTodayRating(ratingVal);
    onNewEntry(undefined, todayMood || 'Calm', ratingVal);
  };

  const handleSelectMood = (moodVal: MoodType) => {
    setTodayMood(moodVal);
    loadAiPrompt(moodVal);
  };

  const handleSetQuickReminder = async () => {
    try {
      await api.createReminder({
        reminderTime: '21:00',
        frequency: 'daily',
        message: 'Take a quiet moment to write about your day in Multi Diary 🌸',
        enabled: true,
      });
      setShowReminderSuggestion(false);
      alert('Smart daily reminder set for 9:00 PM ✓');
    } catch (err) {
      alert('Could not set reminder');
    }
  };

  // Recent entries (limit 4)
  const recentEntries = entries.slice(0, 4);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Greeting & Today Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-rose-50/70 via-stone-50 to-amber-50/50 dark:from-stone-900 dark:via-stone-900 dark:to-rose-950/20 border border-stone-200/80 dark:border-stone-800 shadow-sm relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            {todayFormatted}
          </span>
          <h1 className="text-2xl md:text-4xl font-bold font-serif text-stone-900 dark:text-stone-50">
            {getGreeting()}, {user?.name || 'Friend'} 🌸
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-lg">
            A sanctuary for your thoughts, emotions, memories, and peaceful reflections.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={() => onNewEntry()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium text-sm shadow-md shadow-rose-200 dark:shadow-none transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Diary Entry</span>
          </button>
        </div>

        {/* Decorative soft blurred background elements */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-200/30 dark:bg-rose-900/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* "On This Day" Highlight Card if past memories exist */}
      {onThisDayMemories.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-50 via-rose-50 to-pink-50 dark:from-amber-950/20 dark:via-rose-950/20 dark:to-stone-900 border border-amber-200/70 dark:border-amber-900/40 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              On This Day 🌸
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {new Date(onThisDayMemories[0].date).getFullYear()} (
              {new Date().getFullYear() - new Date(onThisDayMemories[0].date).getFullYear()} year
              {new Date().getFullYear() - new Date(onThisDayMemories[0].date).getFullYear() > 1 ? 's' : ''} ago)
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
              {onThisDayMemories[0].title}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-300 line-clamp-2 italic">
              “{onThisDayMemories[0].plainTextContent}”
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300">
                {onThisDayMemories[0].mood}
              </span>
              <span className="text-xs text-amber-600 flex items-center">
                {'★'.repeat(onThisDayMemories[0].rating)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenEntry(onThisDayMemories[0])}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Memory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Column (Feeling Check-in, Prompt, Recent Entries) & Right Column (AI Insights, Quick Links, Reminders) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* How are you feeling today? Section */}
          <div className="p-6 md:p-7 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-50">
                How are you feeling today?
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Rate your day from 1 to 5 stars or choose your emotional state:
              </p>
            </div>

            {/* Rating Stars Bar */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { star: 1, label: 'Very difficult' },
                { star: 2, label: 'Difficult' },
                { star: 3, label: 'Okay' },
                { star: 4, label: 'Good' },
                { star: 5, label: 'Excellent' },
              ].map(item => (
                <button
                  key={item.star}
                  type="button"
                  onClick={() => handleQuickCheckin(item.star)}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                    todayRating === item.star
                      ? 'border-amber-400 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm'
                      : 'border-stone-200 dark:border-stone-800 hover:border-amber-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <div className="flex items-center text-amber-400">
                    <Star
                      className={`w-5 h-5 ${
                        todayRating && item.star <= todayRating ? 'fill-amber-400' : ''
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-stone-800 dark:text-stone-200">
                    {item.star} ⭐
                  </span>
                  <span className="text-[10px] text-stone-400 leading-tight hidden sm:block">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Mood selector pills */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 block mb-2">
                Quick Mood Selector:
              </span>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map(m => (
                  <button
                    key={m.mood}
                    type="button"
                    onClick={() => handleSelectMood(m.mood)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                      todayMood === m.mood
                        ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-semibold'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Today's Reflection Prompt Banner */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                  Today's Reflection
                </span>
                <p className="text-xs text-stone-600 dark:text-stone-300 font-serif italic">
                  “Take a moment to write about something that made today meaningful.”
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNewEntry(undefined, todayMood || undefined, todayRating || undefined)}
                className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:border-rose-400 transition cursor-pointer"
              >
                Write Now
              </button>
            </div>
          </div>

          {/* AI-Generated Diary Prompts */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-50/60 via-amber-50/40 to-stone-50 dark:from-stone-900 dark:via-stone-900 dark:to-amber-950/20 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Personalized AI Prompt
              </span>
              <button
                type="button"
                onClick={() => loadAiPrompt()}
                disabled={isLoadingPrompt}
                className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPrompt ? 'animate-spin' : ''}`} />
                <span>Give me a prompt ✨</span>
              </button>
            </div>

            <p className="text-sm md:text-base font-serif italic text-stone-800 dark:text-stone-100 leading-relaxed">
              “{aiPrompt || 'What is something simple that brought a sense of peace or wonder to your day?'}”
            </p>

            <button
              type="button"
              onClick={() => onNewEntry()}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Write with this prompt</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recent Diary Entries */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-50">
                Recent Diary Entries
              </h2>
              <button
                type="button"
                onClick={() => onNavigateTab('diary')}
                className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({entries.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {recentEntries.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-3">
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  No diary entries recorded yet. Begin your mindful journey today.
                </p>
                <button
                  type="button"
                  onClick={() => onNewEntry()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-sm transition"
                >
                  Write Your First Entry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentEntries.map(entry => (
                  <div
                    key={entry.id}
                    onClick={() => onOpenEntry(entry)}
                    className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-rose-300 dark:hover:border-rose-900 hover:shadow-md transition cursor-pointer space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-stone-400">
                        <span>
                          {new Date(entry.date + 'T12:00:00Z').toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-amber-400 text-xs">
                            {'★'.repeat(entry.rating)}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold font-serif text-stone-900 dark:text-stone-50 line-clamp-1">
                        {entry.title}
                      </h3>

                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                        {entry.plainTextContent}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-medium">
                        {entry.mood}
                      </span>
                      <div className="flex items-center gap-2 text-stone-400">
                        {entry.photos && entry.photos.length > 0 && (
                          <span className="flex items-center gap-0.5 text-[11px]" title="Photos">
                            <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
                            {entry.photos.length}
                          </span>
                        )}
                        {entry.voiceRecording && (
                          <span title="Voice Diary">
                            <Mic className="w-3.5 h-3.5 text-amber-500" />
                          </span>
                        )}
                        {entry.musicAttachment && (
                          <span title="Music of the Day">
                            <Music className="w-3.5 h-3.5 text-purple-500" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column (AI Insights, Smart Reminders, Shortcuts) */}
        <div className="space-y-6">
          {/* Smart Reminders Suggestion Card */}
          {showReminderSuggestion && (
            <div className="p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>Smart Reminder</span>
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                “You usually write your diary around 9 PM. Would you like a daily reminder at 9 PM?”
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSetQuickReminder}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold shadow-sm transition"
                >
                  Set Reminder
                </button>
                <button
                  type="button"
                  onClick={() => setShowReminderSuggestion(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 transition"
                >
                  Not Now
                </button>
              </div>
            </div>
          )}

          {/* AI Insights Section */}
          <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-50 flex items-center gap-1.5 font-serif">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                AI Insights & Observations
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('insights')}
                className="text-xs text-rose-500 hover:underline"
              >
                More
              </button>
            </div>

            {insights.length === 0 ? (
              <p className="text-xs text-stone-500 dark:text-stone-400 italic">
                Multi Diary is observing your reflections. More entries will generate personalized insights.
              </p>
            ) : (
              <div className="space-y-3">
                {insights.slice(0, 3).map((ins, idx) => (
                  <div
                    key={ins.id || idx}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-stone-400">
                      <span className="uppercase font-semibold text-rose-600 dark:text-rose-400">
                        {ins.category}
                      </span>
                      <span>{ins.date}</span>
                    </div>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                      {ins.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <span className="text-[10px] text-stone-400 block pt-1">
              Observations describe behavioral patterns without clinical diagnosis.
            </span>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('calendar')}
              className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-rose-400 transition text-left space-y-2 group shadow-sm cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Calendar
                </span>
                <span className="text-[11px] text-stone-400">View by day/month</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('timeline')}
              className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-rose-400 transition text-left space-y-2 group shadow-sm cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Timeline
                </span>
                <span className="text-[11px] text-stone-400">Life milestones</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('memories')}
              className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-rose-400 transition text-left space-y-2 group shadow-sm cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Memories
                </span>
                <span className="text-[11px] text-stone-400">Photos & Gallery</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('voice')}
              className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-rose-400 transition text-left space-y-2 group shadow-sm cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Voice Diary
                </span>
                <span className="text-[11px] text-stone-400">Record & listen</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
