import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Star,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import type { DiaryEntry, MoodType } from '../types/diary';

interface CalendarViewProps {
  onNewEntryForDate: (dateStr: string) => void;
  onOpenEntry: (entry: DiaryEntry) => void;
}

type ViewMode = 'month' | 'week' | 'day';

export const CalendarView: React.FC<CalendarViewProps> = ({
  onNewEntryForDate,
  onOpenEntry,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await api.getEntries({ isArchived: false });
      setEntries(res.entries || []);
    } catch (e) {
      console.error('Failed to fetch calendar entries:', e);
    }
  };

  // Group entries by date (YYYY-MM-DD)
  const entriesByDate: Record<string, DiaryEntry[]> = {};
  entries.forEach(e => {
    if (!entriesByDate[e.date]) entriesByDate[e.date] = [];
    entriesByDate[e.date].push(e);
  });

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().slice(0, 10));
  };

  // Month calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  // Days for month grid
  const calendarCells = [];
  // Empty padding cells for preceding month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarCells.push(null);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({ day, dateStr });
  }

  // Selected date entries
  const selectedEntries = entriesByDate[selectedDateStr] || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-serif text-stone-900 dark:text-stone-50">
              📅 {monthName}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {entries.length} reflections recorded
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="p-1 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Day
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
          >
            Today
          </button>

          <div className="flex items-center gap-1 border border-stone-200 dark:border-stone-700 rounded-xl p-0.5">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout: Calendar Table + Selected Date Detail Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View Container (2 cols on large screen) */}
        <div className="lg:col-span-2 p-5 md:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          {viewMode === 'month' && (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-stone-400 uppercase tracking-wider py-1 border-b border-stone-100 dark:border-stone-800">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                {calendarCells.map((cell, idx) => {
                  if (!cell) {
                    return <div key={`empty-${idx}`} className="min-h-[85px] md:min-h-[100px] rounded-2xl bg-stone-50/40 dark:bg-stone-900/30" />;
                  }

                  const dayEntries = entriesByDate[cell.dateStr] || [];
                  const isSelected = selectedDateStr === cell.dateStr;
                  const isToday = cell.dateStr === new Date().toISOString().slice(0, 10);
                  const firstEntry = dayEntries[0];

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => setSelectedDateStr(cell.dateStr)}
                      className={`min-h-[85px] md:min-h-[105px] p-2 rounded-2xl border transition cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 shadow-xs'
                          : dayEntries.length > 0
                          ? 'border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 hover:border-rose-300'
                          : 'border-stone-100 dark:border-stone-800/60 hover:bg-stone-50/70 dark:hover:bg-stone-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday
                              ? 'bg-rose-500 text-white font-bold'
                              : 'text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          {cell.day}
                        </span>

                        {dayEntries.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300">
                            {dayEntries.length}
                          </span>
                        )}
                      </div>

                      {firstEntry ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-sm" title={firstEntry.mood}>
                              {firstEntry.mood === 'Happy' && '😊'}
                              {firstEntry.mood === 'Excited' && '🎉'}
                              {firstEntry.mood === 'Calm' && '😌'}
                              {firstEntry.mood === 'Grateful' && '🌸'}
                              {firstEntry.mood === 'Loved' && '❤️'}
                              {firstEntry.mood === 'Motivated' && '⚡'}
                              {firstEntry.mood === 'Neutral' && '😐'}
                              {firstEntry.mood === 'Tired' && '🥱'}
                              {firstEntry.mood === 'Anxious' && '😟'}
                              {firstEntry.mood === 'Stressed' && '😫'}
                              {firstEntry.mood === 'Sad' && '😢'}
                              {firstEntry.mood === 'Lonely' && '🌧️'}
                              {firstEntry.mood === 'Angry' && '😠'}
                            </span>
                            <span className="text-amber-400 text-[10px] font-bold">
                              ★{firstEntry.rating}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-600 dark:text-stone-400 font-serif line-clamp-1">
                            {firstEntry.title}
                          </p>
                        </div>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center py-1">
                          <span className="text-[10px] text-stone-400">+ Write</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {viewMode === 'week' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">
                Weekly Overview
              </span>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                  const d = new Date(currentDate);
                  const currentDay = d.getDay();
                  d.setDate(d.getDate() - currentDay + offset);
                  const dateStr = d.toISOString().slice(0, 10);
                  const dayEntries = entriesByDate[dateStr] || [];
                  const isSelected = selectedDateStr === dateStr;

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={`p-3 rounded-2xl border transition cursor-pointer min-h-[140px] flex flex-col justify-between ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30'
                          : 'border-stone-200 dark:border-stone-800 hover:border-rose-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        {d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })}
                      </div>

                      {dayEntries.length > 0 ? (
                        <div className="space-y-1">
                          <div className="text-sm">{dayEntries[0].mood}</div>
                          <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 font-serif">
                            {dayEntries[0].title}
                          </p>
                          <div className="text-amber-400 text-xs">
                            {'★'.repeat(dayEntries[0].rating)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">No entry</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'day' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {new Date(selectedDateStr + 'T12:00:00Z').toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => onNewEntryForDate(selectedDateStr)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Write for This Day</span>
                </button>
              </div>

              {selectedEntries.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-xs text-stone-400">No reflections written for this day.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEntries.map(e => (
                    <div
                      key={e.id}
                      onClick={() => onOpenEntry(e)}
                      className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 hover:border-rose-400 transition cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-stone-400">
                        <span>{e.time}</span>
                        <span className="text-amber-400">{'★'.repeat(e.rating)}</span>
                      </div>
                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif">
                        {e.title}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                        {e.plainTextContent}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Date Entries Panel (1 col) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                Selected Date
              </span>
              <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-50">
                {new Date(selectedDateStr + 'T12:00:00Z').toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
            </div>

            {selectedEntries.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  No diary entries recorded on this day.
                </p>
                <button
                  type="button"
                  onClick={() => onNewEntryForDate(selectedDateStr)}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-sm transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Write for This Day</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
                  {selectedEntries.length} {selectedEntries.length === 1 ? 'Reflection' : 'Reflections'}:
                </span>
                {selectedEntries.map(e => (
                  <div
                    key={e.id}
                    onClick={() => onOpenEntry(e)}
                    className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 hover:border-rose-400 transition cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {e.mood}
                      </span>
                      <span className="text-amber-400 text-xs">{'★'.repeat(e.rating)}</span>
                    </div>

                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif group-hover:text-rose-500 transition line-clamp-1">
                      {e.title}
                    </h4>

                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                      {e.plainTextContent}
                    </p>

                    <div className="pt-2 flex items-center justify-end text-[11px] font-semibold text-rose-500">
                      <span>Read Entry →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNewEntryForDate(selectedDateStr)}
            className="w-full py-2.5 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-rose-400 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-rose-500 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Another Entry for this Date</span>
          </button>
        </div>
      </div>
    </div>
  );
};
