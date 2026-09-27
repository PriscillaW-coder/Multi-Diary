import React, { useState, useEffect } from 'react';
import {
  Clock,
  Star,
  Image as ImageIcon,
  Mic,
  Music,
  Filter,
  Calendar,
  Sparkles,
  ArrowDown,
  Tag,
} from 'lucide-react';
import { api } from '../services/api';
import type { DiaryEntry, MoodType } from '../types/diary';

interface TimelineViewProps {
  onOpenEntry: (entry: DiaryEntry) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ onOpenEntry }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'photos' | 'voice' | 'music' | 'high_rated'>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const res = await api.getEntries({ isArchived: false });
      setEntries(res.entries || []);
    } catch (e) {
      console.error('Failed to fetch timeline entries:', e);
    }
  };

  // Filter entries
  let filtered = [...entries];
  if (filterType === 'photos') {
    filtered = filtered.filter(e => e.photos && e.photos.length > 0);
  } else if (filterType === 'voice') {
    filtered = filtered.filter(e => !!e.voiceRecording);
  } else if (filterType === 'music') {
    filtered = filtered.filter(e => !!e.musicAttachment);
  } else if (filterType === 'high_rated') {
    filtered = filtered.filter(e => e.rating >= 4);
  }

  if (selectedMood !== 'all') {
    filtered = filtered.filter(e => e.mood.toLowerCase() === selectedMood.toLowerCase());
  }

  // Group by Year
  const groupedByYear: Record<string, DiaryEntry[]> = {};
  filtered.forEach(e => {
    const yr = e.date.slice(0, 4);
    if (!groupedByYear[yr]) groupedByYear[yr] = [];
    groupedByYear[yr].push(e);
  });

  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-serif text-stone-900 dark:text-stone-50">
              Personal Timeline
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              A chronological journey through your memories & milestones
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType('photos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              filterType === 'photos'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('voice')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              filterType === 'voice'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('music')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              filterType === 'music'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Music</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('high_rated')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              filterType === 'high_rated'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
            <span>High Rated (4-5★)</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
          <p className="text-sm text-stone-400">No moments found matching this timeline filter.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {sortedYears.map(yr => (
            <div key={yr} className="space-y-6">
              {/* Year Marker */}
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-100 px-4 py-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs">
                  {yr}
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-stone-200 dark:from-stone-800 to-transparent" />
                <ArrowDown className="w-4 h-4 text-stone-400" />
              </div>

              {/* Entries along timeline vertical spine */}
              <div className="relative pl-6 md:pl-8 border-l-2 border-rose-200 dark:border-rose-900/60 ml-4 space-y-8">
                {groupedByYear[yr].map(entry => {
                  const entryDateFormatted = new Date(entry.date + 'T12:00:00Z').toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                  });

                  return (
                    <div key={entry.id} className="relative group">
                      {/* Timeline node icon */}
                      <div className="absolute -left-[35px] md:-left-[43px] top-1.5 w-6 h-6 rounded-full bg-white dark:bg-stone-900 border-2 border-rose-500 flex items-center justify-center text-[10px] group-hover:scale-125 transition-transform shadow-xs">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                      </div>

                      {/* Timeline Card */}
                      <div
                        onClick={() => onOpenEntry(entry)}
                        className="p-5 md:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-rose-300 dark:hover:border-rose-900 hover:shadow-md transition cursor-pointer space-y-3"
                      >
                        {/* Header: Date + Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-stone-800 dark:text-stone-200 text-sm font-serif">
                            {entryDateFormatted}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-500 font-bold">
                              ⭐ Rating: {entry.rating}/5
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
                              Mood: {entry.mood}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-base md:text-lg font-bold font-serif text-stone-900 dark:text-stone-50 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">
                          {entry.title}
                        </h3>

                        {/* Content snippet */}
                        <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed">
                          {entry.plainTextContent}
                        </p>

                        {/* Attached Photos row */}
                        {entry.photos && entry.photos.length > 0 && (
                          <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                            {entry.photos.slice(0, 4).map(p => (
                              <img
                                key={p.id}
                                src={p.url}
                                alt="Memory thumbnail"
                                className="w-16 h-16 rounded-xl object-cover border border-stone-200 dark:border-stone-700"
                              />
                            ))}
                          </div>
                        )}

                        {/* Voice or Music badges */}
                        <div className="flex items-center gap-3 pt-1 text-xs text-stone-500 dark:text-stone-400">
                          {entry.voiceRecording && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                              <Mic className="w-3.5 h-3.5" />
                              <span>Voice Diary</span>
                            </span>
                          )}
                          {entry.musicAttachment && (
                            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                              <Music className="w-3.5 h-3.5" />
                              <span>{entry.musicAttachment.title}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
