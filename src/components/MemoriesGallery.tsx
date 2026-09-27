import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Calendar,
  Maximize2,
  X,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import type { DiaryEntry, PhotoAttachment } from '../types/diary';

interface MemoriesGalleryProps {
  onOpenEntry: (entry: DiaryEntry) => void;
}

interface PhotoItem {
  photo: PhotoAttachment;
  entry: DiaryEntry;
}

export const MemoriesGallery: React.FC<MemoriesGalleryProps> = ({ onOpenEntry }) => {
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);
  const [lightboxItem, setLightboxItem] = useState<PhotoItem | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const res = await api.getEntries({ hasPhotos: true, isArchived: false });
      const items: PhotoItem[] = [];
      (res.entries || []).forEach(e => {
        (e.photos || []).forEach(p => {
          items.push({ photo: p, entry: e });
        });
      });
      setPhotoItems(items);
    } catch (err) {
      console.error('Failed to load memories gallery:', err);
    }
  };

  // Months available
  const months = Array.from(new Set(photoItems.map(p => p.entry.date.slice(0, 7)))).sort().reverse();

  const filteredPhotos = selectedMonth === 'all'
    ? photoItems
    : photoItems.filter(p => p.entry.date.startsWith(selectedMonth));

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-serif text-stone-900 dark:text-stone-50">
              Memories Gallery
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {photoItems.length} precious captured moments
            </p>
          </div>
        </div>

        {/* Filter by Month */}
        {months.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-200"
            >
              <option value="all">All Months</option>
              {months.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filteredPhotos.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
          <p className="text-sm text-stone-400">
            No memories with attached photos yet. Attach photos when creating or editing diary entries.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((item, idx) => (
            <div
              key={item.photo.id || idx}
              onClick={() => setLightboxItem(item)}
              className="group relative aspect-square rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 cursor-pointer shadow-xs hover:shadow-md transition"
            >
              <img
                src={item.photo.url}
                alt={item.photo.caption || 'Diary memory'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between text-white">
                <div className="flex justify-end">
                  <span className="p-1.5 rounded-full bg-stone-900/60 backdrop-blur-sm">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-stone-300 block font-medium">
                    {item.entry.date} • {item.entry.mood}
                  </span>
                  <h4 className="text-xs font-bold font-serif line-clamp-1">
                    {item.entry.title}
                  </h4>
                  {item.photo.caption && (
                    <p className="text-[11px] text-stone-300 line-clamp-1 italic">
                      “{item.photo.caption}”
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-md p-4">
          <button
            type="button"
            onClick={() => setLightboxItem(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-stone-800 text-white hover:bg-stone-700 transition"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full flex flex-col items-center space-y-4">
            <img
              src={lightboxItem.photo.url}
              alt={lightboxItem.photo.caption || 'Memory full view'}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            <div className="w-full max-w-xl p-4 rounded-2xl bg-stone-900/90 border border-stone-800 text-white flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-stone-400 block">
                  {lightboxItem.entry.date} • {lightboxItem.entry.mood}
                </span>
                <h4 className="text-sm font-bold font-serif">
                  {lightboxItem.entry.title}
                </h4>
                {lightboxItem.photo.caption && (
                  <p className="text-xs text-stone-300 italic mt-0.5">
                    “{lightboxItem.photo.caption}”
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  const e = lightboxItem.entry;
                  setLightboxItem(null);
                  onOpenEntry(e);
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shrink-0 flex items-center gap-1.5 transition"
              >
                <span>Read Diary Entry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
