import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Calendar,
  Star,
  Image as ImageIcon,
  Mic,
  Music,
  Trash2,
  Edit3,
  Copy,
  Archive,
  ChevronDown,
  X,
  Tag,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import type { DiaryEntry, MoodType, SearchFilters } from '../types/diary';

interface DiaryListProps {
  onNewEntry: () => void;
  onOpenEntry: (entry: DiaryEntry) => void;
  onEditEntry: (entry: DiaryEntry) => void;
}

const ALL_MOODS: MoodType[] = [
  'Happy',
  'Excited',
  'Calm',
  'Grateful',
  'Loved',
  'Motivated',
  'Neutral',
  'Tired',
  'Confused',
  'Anxious',
  'Stressed',
  'Sad',
  'Lonely',
  'Angry',
];

export const DiaryList: React.FC<DiaryListProps> = ({
  onNewEntry,
  onOpenEntry,
  onEditEntry,
}) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hasPhotos, setHasPhotos] = useState(false);
  const [hasVoice, setHasVoice] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Delete modal state
  const [entryToDelete, setEntryToDelete] = useState<DiaryEntry | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [searchQuery, dateRange, startDate, endDate, selectedMood, selectedRating, hasPhotos, hasVoice, showArchived]);

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const filters: SearchFilters = {
        query: searchQuery.trim() || undefined,
        dateRange: dateRange !== 'all' ? dateRange : undefined,
        startDate: dateRange === 'custom' && startDate ? startDate : undefined,
        endDate: dateRange === 'custom' && endDate ? endDate : undefined,
        moods: selectedMood !== 'all' ? [selectedMood as MoodType] : undefined,
        ratings: selectedRating ? [selectedRating] : undefined,
        hasPhotos: hasPhotos ? true : undefined,
        hasVoice: hasVoice ? true : undefined,
        isArchived: showArchived,
      };

      const res = await api.getEntries(filters);
      setEntries(res.entries || []);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, entry: DiaryEntry) => {
    e.stopPropagation();
    try {
      const res = await api.duplicateEntry(entry.id);
      setEntries([res.entry, ...entries]);
    } catch (err) {
      alert('Failed to duplicate entry');
    }
  };

  const handleArchive = async (e: React.MouseEvent, entry: DiaryEntry) => {
    e.stopPropagation();
    try {
      const res = await api.archiveEntry(entry.id);
      setEntries(entries.filter(item => item.id !== entry.id));
    } catch (err) {
      alert('Failed to update archive status');
    }
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      await api.deleteEntry(entryToDelete.id);
      setEntries(entries.filter(item => item.id !== entryToDelete.id));
      setEntryToDelete(null);
    } catch (err) {
      alert('Failed to delete entry');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDateRange('all');
    setStartDate('');
    setEndDate('');
    setSelectedMood('all');
    setSelectedRating(null);
    setHasPhotos(false);
    setHasVoice(false);
    setShowArchived(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Title & Action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-stone-900 dark:text-stone-50">
            {showArchived ? 'Archived Reflections' : 'My Diary'}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} found
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
              showArchived
                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Show Active' : 'Archive'}</span>
          </button>

          <button
            type="button"
            onClick={onNewEntry}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-200 dark:shadow-none transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search titles, memories, emotions, tags, places..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm ${
            showFilters || selectedMood !== 'all' || selectedRating || dateRange !== 'all'
              ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
              : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expanded Filter Panel */}
      {showFilters && (
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Filter Entries
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-rose-500 hover:underline"
            >
              Reset all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Date filter */}
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-700 dark:text-stone-300 block">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Date Range</option>
              </select>

              {dateRange === 'custom' && (
                <div className="space-y-1 pt-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-[11px]"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-[11px]"
                  />
                </div>
              )}
            </div>

            {/* Mood filter */}
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-700 dark:text-stone-300 block">
                Mood / Emotion
              </label>
              <select
                value={selectedMood}
                onChange={e => setSelectedMood(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              >
                <option value="all">Any Mood</option>
                {ALL_MOODS.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating filter */}
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-700 dark:text-stone-300 block">
                Daily Rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(selectedRating === star ? null : star)}
                    className={`p-1.5 rounded-lg border transition ${
                      selectedRating === star
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/60 text-amber-500 font-bold'
                        : 'border-stone-200 dark:border-stone-700 text-stone-400'
                    }`}
                  >
                    ★ {star}
                  </button>
                ))}
              </div>
            </div>

            {/* Media attachments */}
            <div className="space-y-1.5">
              <label className="font-semibold text-stone-700 dark:text-stone-300 block">
                Media Attachments
              </label>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPhotos}
                    onChange={e => setHasPhotos(e.target.checked)}
                    className="rounded text-rose-500"
                  />
                  <span>Has Photos</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasVoice}
                    onChange={e => setHasVoice(e.target.checked)}
                    className="rounded text-rose-500"
                  />
                  <span>Has Voice Recording</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diary Entries List Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-stone-400 text-sm">
          Loading your reflections...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            No entries match your search or filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-rose-500 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {entries.map(entry => (
            <div
              key={entry.id}
              onClick={() => onOpenEntry(entry)}
              className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-rose-300 dark:hover:border-rose-900 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group relative"
            >
              <div className="space-y-3">
                {/* Header row: Date, time, rating */}
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span className="flex items-center gap-1 font-medium text-stone-600 dark:text-stone-400">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    {new Date(entry.date + 'T12:00:00Z').toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400">
                    {'★'.repeat(entry.rating)}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-50 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition line-clamp-1">
                  {entry.title}
                </h3>

                {/* Location if present */}
                {entry.location?.name && (
                  <div className="flex items-center gap-1 text-[11px] text-stone-400">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>{entry.location.name}</span>
                  </div>
                )}

                {/* Plain text preview */}
                <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed">
                  {entry.plainTextContent}
                </p>

                {/* Photo preview strip */}
                {entry.photos && entry.photos.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                    {entry.photos.slice(0, 3).map(p => (
                      <img
                        key={p.id}
                        src={p.url}
                        alt="Photo preview"
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200 dark:border-stone-700"
                      />
                    ))}
                    {entry.photos.length > 3 && (
                      <span className="text-[10px] font-semibold text-stone-400 px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800">
                        +{entry.photos.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* AI Reflection snippet */}
                {entry.aiReflection && (
                  <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-[11px] text-stone-600 dark:text-stone-300 italic flex items-start gap-1.5 font-serif line-clamp-2">
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                    <span>“{entry.aiReflection.text}”</span>
                  </div>
                )}
              </div>

              {/* Bottom footer row: Mood & Tags, plus hover action buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
                    {entry.mood}
                  </span>
                  {entry.tags?.slice(0, 2).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full bg-stone-50 dark:bg-stone-800/60 text-stone-500 dark:text-stone-400 text-[10px]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onEditEntry(entry);
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={e => handleDuplicate(e, entry)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={e => handleArchive(e, entry)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                    title={entry.archived ? 'Unarchive' : 'Archive'}
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setEntryToDelete(entry);
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-stone-900 dark:text-stone-50">
                Delete this diary entry?
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                “This action cannot be undone.”
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-200 dark:shadow-none transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
