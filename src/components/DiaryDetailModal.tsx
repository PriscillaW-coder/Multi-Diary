import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Star,
  MapPin,
  Tag,
  Sparkles,
  Edit3,
  Copy,
  Archive,
  Trash2,
  Volume2,
  Music,
  Share2,
  Maximize2,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import type { DiaryEntry } from '../types/diary';

interface DiaryDetailModalProps {
  entry: DiaryEntry;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
  onDuplicate: (entry: DiaryEntry) => void;
  onArchiveToggle: (entry: DiaryEntry) => void;
}

export const DiaryDetailModal: React.FC<DiaryDetailModalProps> = ({
  entry,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onArchiveToggle,
}) => {
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry>(entry);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isRegeneratingReflection, setIsRegeneratingReflection] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteEntry(currentEntry.id);
      onDelete(currentEntry.id);
      onClose();
    } catch (err) {
      alert('Failed to delete entry');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await api.duplicateEntry(currentEntry.id);
      onDuplicate(res.entry);
      onClose();
    } catch (err) {
      alert('Failed to duplicate entry');
    }
  };

  const handleArchive = async () => {
    try {
      const res = await api.archiveEntry(currentEntry.id);
      setCurrentEntry(res.entry);
      onArchiveToggle(res.entry);
    } catch (err) {
      alert('Failed to update archive status');
    }
  };

  const handleRegenerateReflection = async () => {
    setIsRegeneratingReflection(true);
    try {
      const res = await api.getAiReflection({
        title: currentEntry.title,
        plainTextContent: currentEntry.plainTextContent,
        rating: currentEntry.rating,
        mood: currentEntry.mood,
        date: currentEntry.date,
        entryId: currentEntry.id,
      });

      const updated = {
        ...currentEntry,
        aiReflection: {
          text: res.reflection,
          generatedAt: new Date().toISOString(),
        },
      };
      setCurrentEntry(updated);
    } catch (err) {
      alert('Failed to regenerate reflection');
    } finally {
      setIsRegeneratingReflection(false);
    }
  };

  const handleDeleteReflection = async () => {
    try {
      const res = await api.updateEntry(currentEntry.id, { aiReflection: undefined });
      setCurrentEntry(res.entry);
    } catch (err) {
      alert('Failed to remove reflection');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl relative my-8 max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl" title={currentEntry.mood}>
                {currentEntry.mood === 'Happy' && '😊'}
                {currentEntry.mood === 'Excited' && '🎉'}
                {currentEntry.mood === 'Calm' && '😌'}
                {currentEntry.mood === 'Grateful' && '🌸'}
                {currentEntry.mood === 'Loved' && '❤️'}
                {currentEntry.mood === 'Motivated' && '⚡'}
                {currentEntry.mood === 'Neutral' && '😐'}
                {currentEntry.mood === 'Tired' && '🥱'}
                {currentEntry.mood === 'Anxious' && '😟'}
                {currentEntry.mood === 'Stressed' && '😫'}
                {currentEntry.mood === 'Sad' && '😢'}
                {currentEntry.mood === 'Lonely' && '🌧️'}
                {currentEntry.mood === 'Angry' && '😠'}
              </span>
              <span className="font-semibold text-xs px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                {currentEntry.mood}
              </span>
              {currentEntry.archived && (
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Archived
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(currentEntry)}
                className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                title="Edit entry"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                title="Duplicate entry"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleArchive}
                className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                title={currentEntry.archived ? 'Unarchive' : 'Archive'}
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                title="Delete entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-stone-200 dark:bg-stone-800 mx-1" />
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Entry Body */}
          <div className="py-6 space-y-6 overflow-y-auto pr-1 flex-1">
            {/* Metadata (Date, Time, Rating, Location) */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-medium text-stone-700 dark:text-stone-300">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  {new Date(currentEntry.date + 'T12:00:00Z').toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {currentEntry.time}
                </span>
              </div>

              {/* Rating stars */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= currentEntry.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-200 dark:text-stone-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-stone-900 dark:text-stone-50">
              {currentEntry.title}
            </h1>

            {/* Location */}
            {currentEntry.location?.name && (
              <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{currentEntry.location.name}</span>
              </div>
            )}

            {/* Music of the Day Player */}
            {currentEntry.musicAttachment && (
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-200 dark:bg-purple-900/60 flex items-center justify-center text-purple-700 dark:text-purple-300">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                      Song of the Day
                    </span>
                    <span className="text-sm font-semibold text-purple-950 dark:text-purple-100">
                      {currentEntry.musicAttachment.title}
                    </span>
                    <span className="text-xs text-purple-700/80 dark:text-purple-300 block">
                      {currentEntry.musicAttachment.artist}
                    </span>
                  </div>
                </div>
                <audio controls src={currentEntry.musicAttachment.url} className="h-8 max-w-full sm:w-64" />
              </div>
            )}

            {/* Voice Diary Player */}
            {currentEntry.voiceRecording && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                    <Volume2 className="w-4 h-4 text-amber-600" />
                    <span>Voice Diary</span>
                  </div>
                  {currentEntry.voiceRecording.duration && (
                    <span className="text-xs text-amber-700 dark:text-amber-300">
                      {currentEntry.voiceRecording.duration}s
                    </span>
                  )}
                </div>
                <audio controls src={currentEntry.voiceRecording.url} className="w-full h-8" />
                {currentEntry.voiceRecording.transcript && (
                  <p className="text-xs text-amber-800 dark:text-amber-300 italic bg-white/70 dark:bg-stone-900/60 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                    “{currentEntry.voiceRecording.transcript}”
                  </p>
                )}
              </div>
            )}

            {/* Rich Content */}
            <div
              className="diary-prose text-stone-800 dark:text-stone-200 text-sm md:text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentEntry.content }}
            />

            {/* Photos Lightbox Grid */}
            {currentEntry.photos && currentEntry.photos.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
                  Memories & Photos ({currentEntry.photos.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {currentEntry.photos.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setLightboxImage(p.url)}
                      className="group relative aspect-video rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 cursor-pointer shadow-sm"
                    >
                      <img
                        src={p.url}
                        alt={p.caption || 'Memory'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-5 h-5" />
                      </div>
                      {p.caption && (
                        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-stone-950/80 to-transparent text-[11px] text-white truncate">
                          {p.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Reflection Card */}
            {currentEntry.aiReflection ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-orange-50/50 dark:from-rose-950/40 dark:via-amber-950/20 dark:to-stone-900 border border-rose-200/80 dark:border-rose-900/60 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5 font-serif">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    AI Companion Reflection
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={handleRegenerateReflection}
                      disabled={isRegeneratingReflection}
                      className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      {isRegeneratingReflection && <Loader2 className="w-3 h-3 animate-spin" />}
                      Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteReflection}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                      title="Remove reflection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm italic font-serif leading-relaxed text-stone-800 dark:text-stone-200">
                  “{currentEntry.aiReflection.text}”
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50/60 via-amber-50/40 to-stone-50 dark:from-stone-800/60 dark:to-rose-950/30 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 font-serif">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    AI Companion Reflection
                  </span>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Get an empathetic personal reflection and emotional insights on this entry.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateReflection}
                  disabled={isRegeneratingReflection}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition"
                >
                  {isRegeneratingReflection ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Generate Reflection</span>
                </button>
              </div>
            )}

            {/* AI Emotion & Sentiment Breakdown */}
            {(currentEntry.aiEmotions || currentEntry.aiSentiment) && (
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    Emotion & Sentiment Interpretation
                  </span>
                  <span className="text-[10px] text-stone-400">AI analysis</span>
                </div>

                {currentEntry.aiEmotions && (
                  <div className="flex flex-wrap gap-2">
                    {currentEntry.aiEmotions.map((e, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5"
                      >
                        <span>{e.emotion}</span>
                        <span className="font-bold text-rose-500">{e.percentage}%</span>
                      </span>
                    ))}
                  </div>
                )}

                {currentEntry.aiSentiment && (
                  <p className="text-xs text-stone-600 dark:text-stone-400 pt-1 border-t border-stone-200 dark:border-stone-700">
                    <strong className="text-stone-800 dark:text-stone-200">Sentiment:</strong>{' '}
                    {currentEntry.aiSentiment.sentiment} — {currentEntry.aiSentiment.explanation}
                  </p>
                )}
              </div>
            )}

            {/* Tags list */}
            {currentEntry.tags && currentEntry.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                {currentEntry.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                  >
                    <Tag className="w-3 h-3 text-stone-400" />
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-200 dark:shadow-none transition flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 text-white hover:bg-stone-700"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Full view memory"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </>
  );
};
