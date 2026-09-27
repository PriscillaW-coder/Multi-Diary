import React, { useState, useEffect } from 'react';
import {
  Heart,
  TrendingUp,
  Star,
  Smile,
  Calendar,
  Sparkles,
  BarChart2,
  PieChart,
} from 'lucide-react';
import { api } from '../services/api';
import type { DiaryEntry, MoodType } from '../types/diary';

export const MoodAnalytics: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await api.getEntries({ isArchived: false });
      setEntries(res.entries || []);
    } catch (e) {
      console.error('Failed to fetch analytics entries:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-16 text-stone-400 text-sm">Calculating your emotional trends...</div>;
  }

  // Analytics Computations
  const totalEntries = entries.length;

  // Average Rating
  const avgRating = totalEntries > 0
    ? (entries.reduce((acc, e) => acc + e.rating, 0) / totalEntries).toFixed(1)
    : '0.0';

  // Last 7 days average
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  const recentWeekEntries = entries.filter(e => e.date >= weekAgoStr);
  const avgWeeklyRating = recentWeekEntries.length > 0
    ? (recentWeekEntries.reduce((acc, e) => acc + e.rating, 0) / recentWeekEntries.length).toFixed(1)
    : avgRating;

  // This month's average
  const currentMonthPrefix = now.toISOString().slice(0, 7);
  const thisMonthEntries = entries.filter(e => e.date.startsWith(currentMonthPrefix));
  const avgMonthlyRating = thisMonthEntries.length > 0
    ? (thisMonthEntries.reduce((acc, e) => acc + e.rating, 0) / thisMonthEntries.length).toFixed(1)
    : avgRating;

  // Mood frequency
  const moodCounts: Record<string, number> = {};
  entries.forEach(e => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    (e.emotions || []).forEach(emo => {
      if (emo !== e.mood) {
        moodCounts[emo] = (moodCounts[emo] || 0) + 1;
      }
    });
  });

  const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
  const mostCommonMood = sortedMoods.length > 0 ? sortedMoods[0][0] : 'Calm';

  // Positive vs Neutral vs Negative days count
  const positiveMoods = ['Happy', 'Excited', 'Calm', 'Grateful', 'Loved', 'Motivated'];
  const negativeMoods = ['Sad', 'Angry', 'Anxious', 'Lonely', 'Stressed', 'Tired'];

  let positiveDays = 0;
  let neutralDays = 0;
  let negativeDays = 0;

  entries.forEach(e => {
    if (e.rating >= 4 || positiveMoods.includes(e.mood)) {
      positiveDays++;
    } else if (e.rating <= 2 || negativeMoods.includes(e.mood)) {
      negativeDays++;
    } else {
      neutralDays++;
    }
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-serif text-stone-900 dark:text-stone-50">
              Daily Rating & Mood Tracking
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Insightful reflections on your emotional journey and life balance
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">
            Avg Weekly Rating
          </span>
          <div className="text-2xl md:text-3xl font-bold font-serif text-amber-500 flex items-center gap-1.5">
            <Star className="w-6 h-6 fill-current" />
            <span>{avgWeeklyRating} / 5</span>
          </div>
          <span className="text-[11px] text-stone-400">Past 7 days</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">
            Avg Monthly Rating
          </span>
          <div className="text-2xl md:text-3xl font-bold font-serif text-amber-500 flex items-center gap-1.5">
            <Star className="w-6 h-6 fill-current" />
            <span>{avgMonthlyRating} / 5</span>
          </div>
          <span className="text-[11px] text-stone-400">Current calendar month</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">
            Most Common Mood
          </span>
          <div className="text-2xl md:text-3xl font-bold font-serif text-rose-500 flex items-center gap-1.5">
            <Smile className="w-6 h-6" />
            <span>{mostCommonMood}</span>
          </div>
          <span className="text-[11px] text-stone-400">Top recurring emotion</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">
            Positive Days Ratio
          </span>
          <div className="text-2xl md:text-3xl font-bold font-serif text-emerald-500 flex items-center gap-1.5">
            <TrendingUp className="w-6 h-6" />
            <span>{totalEntries > 0 ? Math.round((positiveDays / totalEntries) * 100) : 0}%</span>
          </div>
          <span className="text-[11px] text-stone-400">{positiveDays} of {totalEntries} days rated high</span>
        </div>
      </div>

      {/* Mood Distribution & Days Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mood Breakdown Bar chart */}
        <div className="p-6 md:p-7 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-rose-500" />
              Emotional Landscape Breakdown
            </h3>
            <span className="text-xs text-stone-400">{sortedMoods.length} distinct emotions</span>
          </div>

          <div className="space-y-3">
            {sortedMoods.slice(0, 7).map(([mName, count]) => {
              const pct = totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0;
              return (
                <div key={mName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {mName}
                    </span>
                    <span className="text-stone-400 font-medium">
                      {count} times ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(pct, 100)}%` }}
                      className="h-full bg-gradient-to-r from-rose-400 to-amber-400 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Days Balance */}
        <div className="p-6 md:p-7 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-500" />
                Positive vs. Challenging Days
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Every feeling is valid and part of your human journey
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                    Positive & Uplifting Days
                  </span>
                  <span className="text-[11px] text-emerald-700/80 dark:text-emerald-300">
                    High ratings, joy, gratitude, momentum
                  </span>
                </div>
                <span className="text-xl font-bold font-serif text-emerald-600 dark:text-emerald-400">
                  {positiveDays}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                    Neutral & Reflective Days
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    Steady, calm, observational days
                  </span>
                </div>
                <span className="text-xl font-bold font-serif text-stone-600 dark:text-stone-300">
                  {neutralDays}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                    Challenging Days
                  </span>
                  <span className="text-[11px] text-rose-700/80 dark:text-rose-300">
                    Difficult, tired, or anxious moments
                  </span>
                </div>
                <span className="text-xl font-bold font-serif text-rose-600 dark:text-rose-400">
                  {negativeDays}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-[11px] text-stone-600 dark:text-stone-400 italic">
            <strong>Note:</strong> Multi Diary AI does not provide mental health diagnoses. These statistics simply reflect self-reported diary ratings and linguistic patterns.
          </div>
        </div>
      </div>
    </div>
  );
};
