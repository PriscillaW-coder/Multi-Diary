import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Smile,
  Undo2,
  Redo2,
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Image as ImageIcon,
  Music,
  MapPin,
  Tag,
  Star,
  Sparkles,
  Check,
  X,
  Volume2,
  Loader2,
  Trash2,
  FileText,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  getSupportedAudioMimeType,
  getFriendlyAudioErrorMessage,
  createSafeMediaRecorder,
  createSampleVoiceRecording,
  isSpeechRecognitionSupported,
  createSpeechRecognizer,
} from '../utils/audioRecorder';
import type { DiaryEntry, MoodType, PhotoAttachment, VoiceAttachment, MusicAttachment, AiEmotion, AiSentiment } from '../types/diary';

interface DiaryEditorProps {
  initialEntry?: DiaryEntry | null;
  initialDate?: string;
  onSave: (entry: DiaryEntry) => void;
  onCancel: () => void;
}

const MOODS: Array<{ name: MoodType; emoji: string; label: string; color: string }> = [
  { name: 'Happy', emoji: '😊', label: 'Happy', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  { name: 'Excited', emoji: '🎉', label: 'Excited', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
  { name: 'Calm', emoji: '😌', label: 'Calm', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { name: 'Grateful', emoji: '🌸', label: 'Grateful', color: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300' },
  { name: 'Loved', emoji: '❤️', label: 'Loved', color: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' },
  { name: 'Motivated', emoji: '⚡', label: 'Motivated', color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300' },
  { name: 'Neutral', emoji: '😐', label: 'Neutral', color: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300' },
  { name: 'Tired', emoji: '🥱', label: 'Tired', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  { name: 'Confused', emoji: '🤔', label: 'Confused', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300' },
  { name: 'Anxious', emoji: '😟', label: 'Anxious', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' },
  { name: 'Stressed', emoji: '😫', label: 'Stressed', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
  { name: 'Sad', emoji: '😢', label: 'Sad', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
  { name: 'Lonely', emoji: '🌧️', label: 'Lonely', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300' },
  { name: 'Angry', emoji: '😠', label: 'Angry', color: 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-200' },
];

const COMMON_EMOJIS = ['🌸', '✨', '☕', '🌿', '☀️', '🌙', '🍂', '💖', '📚', '🎶', '🌊', '🕯️', '🕊️', '🧘‍♀️', '💭', '🌻'];

export const DiaryEditor: React.FC<DiaryEditorProps> = ({
  initialEntry,
  initialDate,
  onSave,
  onCancel,
}) => {
  const { user } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);

  // Core fields
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [date, setDate] = useState(initialEntry?.date || initialDate || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(initialEntry?.time || new Date().toTimeString().slice(0, 5));
  const [rating, setRating] = useState<number>(initialEntry?.rating ?? 4);
  const [mood, setMood] = useState<MoodType>(initialEntry?.mood || 'Calm');
  const [emotions, setEmotions] = useState<string[]>(initialEntry?.emotions || ['Calm']);
  const [tags, setTags] = useState<string[]>(initialEntry?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [locationName, setLocationName] = useState(initialEntry?.location?.name || '');
  const [photos, setPhotos] = useState<PhotoAttachment[]>(initialEntry?.photos || []);
  const [voiceRecording, setVoiceRecording] = useState<VoiceAttachment | undefined>(initialEntry?.voiceRecording);
  const [musicAttachment, setMusicAttachment] = useState<MusicAttachment | undefined>(initialEntry?.musicAttachment);

  // AI fields
  const [aiReflection, setAiReflection] = useState<string | undefined>(initialEntry?.aiReflection?.text);
  const [aiEmotions, setAiEmotions] = useState<AiEmotion[] | undefined>(initialEntry?.aiEmotions);
  const [aiSentiment, setAiSentiment] = useState<AiSentiment | undefined>(initialEntry?.aiSentiment);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiNotice, setAiNotice] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);

  // Editor states
  const [isSaved, setIsSaved] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);

  // Audio Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const recordingSecondsRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize editor HTML
  useEffect(() => {
    if (editorRef.current && initialEntry?.content) {
      editorRef.current.innerHTML = initialEntry.content;
      updateCounts();
    }
  }, [initialEntry]);

  // Update word and character counts
  const updateCounts = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    setCharCount(text.length);
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setIsSaved(false);
  };

  // Autosave simulation
  useEffect(() => {
    if (isSaved) return;
    const timeout = setTimeout(() => {
      // Autosave indicator triggers
      setIsSaved(true);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [title, rating, mood, emotions, tags, locationName, photos, voiceRecording, musicAttachment, isSaved]);

  // Rich Text Commands
  const formatDoc = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    updateCounts();
  };

  const insertEmoji = (emoji: string) => {
    formatDoc('insertText', emoji);
    setShowEmojiPicker(false);
  };

  // Mood toggle
  const toggleEmotion = (emotionName: string) => {
    if (emotions.includes(emotionName)) {
      if (emotions.length > 1) {
        setEmotions(emotions.filter(e => e !== emotionName));
      }
    } else {
      setEmotions([...emotions, emotionName]);
    }
    setIsSaved(false);
  };

  // Tag management
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput('');
        setIsSaved(false);
      }
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter(item => item !== t));
    setIsSaved(false);
  };

  // Photo Upload Handler (multiple photos, base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPhotos(prev => [
          ...prev,
          {
            id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            url: result,
            caption: file.name.replace(/\.[^/.]+$/, ''),
            uploadedAt: new Date().toISOString(),
          },
        ]);
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id));
    setIsSaved(false);
  };

  // Voice recording handlers
  const startRecording = async () => {
    setMicError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser environment does not support microphone capture. Please upload an audio file or use a sample voice note.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = createSafeMediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        const reader = new FileReader();
        const durationSnapshot = recordingSecondsRef.current;
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setVoiceRecording({
            id: `voice-${Date.now()}`,
            url: base64data,
            duration: durationSnapshot > 0 ? durationSnapshot : undefined,
            createdAt: new Date().toISOString(),
          });
          setIsSaved(false);
        };
        reader.readAsDataURL(audioBlob);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(s => {
          const next = s + 1;
          recordingSecondsRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone start error:', err);
      const friendly = getFriendlyAudioErrorMessage(err);
      setMicError(friendly);
    }
  };

  const pauseResumeRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      try {
        mediaRecorderRef.current.resume();
      } catch (e) {}
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(s => {
          const next = s + 1;
          recordingSecondsRef.current = next;
          return next;
        });
      }, 1000);
    } else {
      try {
        mediaRecorderRef.current.pause();
      } catch (e) {}
      setIsPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Stop recorder error:', e);
      }
    }
    setIsRecording(false);
    setIsPaused(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const deleteRecording = () => {
    setVoiceRecording(undefined);
    setIsSaved(false);
  };

  const handleUseSampleVoiceNote = () => {
    const sample = createSampleVoiceRecording();
    setVoiceRecording({
      id: `voice-${Date.now()}`,
      url: sample.url,
      duration: sample.duration,
      transcript: sample.transcript,
      createdAt: new Date().toISOString(),
    });
    setMicError(null);
    setIsSaved(false);
    setAiNotice({
      type: 'success',
      message: '🎙️ Sample voice note attached! You can play it or convert to text.',
    });
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMicError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64data = reader.result as string;
      setVoiceRecording({
        id: `voice-${Date.now()}`,
        url: base64data,
        duration: undefined,
        createdAt: new Date().toISOString(),
      });
      setIsSaved(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Transcribe voice recording with Gemini Speech-to-Text
  const handleTranscribeAudio = async () => {
    if (!voiceRecording?.url) return;
    if (voiceRecording.transcript) {
      if (editorRef.current) {
        const paragraph = `<p><em>🎙️ Voice Note Transcript:</em> "${voiceRecording.transcript}"</p>`;
        editorRef.current.innerHTML += paragraph;
        updateCounts();
        setAiNotice({
          type: 'success',
          message: 'Transcribed voice note inserted into your diary!',
        });
      }
      return;
    }

    setIsTranscribing(true);
    try {
      const res = await api.transcribeAudio(voiceRecording.url, 'audio/webm');
      if (res.transcript) {
        setVoiceRecording(prev => (prev ? { ...prev, transcript: res.transcript } : undefined));
        // Append transcript to editor content
        if (editorRef.current) {
          const paragraph = `<p><em>🎙️ Voice Note Transcript:</em> "${res.transcript}"</p>`;
          editorRef.current.innerHTML += paragraph;
          updateCounts();
          setAiNotice({
            type: 'success',
            message: '✨ Audio transcribed and added to diary text!',
          });
        }
      }
    } catch (err: any) {
      setAiNotice({
        type: 'error',
        message: err.message || 'Failed to transcribe audio.',
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  // AI Emotion & Sentiment Analysis
  const handleAnalyzeEntry = async () => {
    setAiNotice(null);
    const text = editorRef.current?.innerText || '';
    if (!text.trim() || text.trim().length < 5) {
      setAiNotice({
        type: 'info',
        message: 'Please write a sentence or two in your diary entry first so AI can detect your emotions.',
      });
      return;
    }
    setIsAnalyzingAi(true);
    try {
      const res = await api.analyzeEmotionAndSentiment(text);
      if (res.analysis) {
        setAiEmotions(res.analysis.emotions);
        setAiSentiment(res.analysis.sentiment);
        setAiNotice({
          type: 'success',
          message: 'Emotions and sentiment analyzed! See detected breakdown below.',
        });
      }
    } catch (err: any) {
      setAiNotice({
        type: 'error',
        message: err.message || 'AI emotion analysis failed. Please try again.',
      });
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // AI Reflection
  const handleGenerateReflection = async () => {
    setAiNotice(null);
    const text = editorRef.current?.innerText || '';
    if (!text.trim() && !title.trim()) {
      setAiNotice({
        type: 'info',
        message: 'Please write a title or a few thoughts in your diary entry first so the AI companion can reflect on your day.',
      });
      return;
    }
    setIsGeneratingReflection(true);
    try {
      const res = await api.getAiReflection({
        title: title || 'Today’s diary',
        plainTextContent: text || title || 'Reflecting on today.',
        rating,
        mood,
        date,
      });
      if (res.reflection) {
        setAiReflection(res.reflection);
        setAiNotice({
          type: 'success',
          message: '✨ AI Companion Reflection ready! Scroll down to read it.',
        });
        setIsSaved(false);
      }
    } catch (err: any) {
      setAiNotice({
        type: 'error',
        message: err.message || 'Failed to generate reflection. Please try again.',
      });
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  // Save Entry
  const handleSave = async () => {
    const content = editorRef.current?.innerHTML || '<p></p>';
    const plainText = editorRef.current?.innerText || '';

    const entryData: Partial<DiaryEntry> = {
      title: title.trim() || 'Untitled Reflection',
      content,
      plainTextContent: plainText,
      date,
      time,
      rating,
      mood,
      emotions,
      tags,
      location: locationName.trim() ? { name: locationName.trim() } : undefined,
      photos,
      voiceRecording,
      musicAttachment,
      aiReflection: aiReflection
        ? { text: aiReflection, generatedAt: new Date().toISOString() }
        : undefined,
      aiEmotions,
      aiSentiment,
    };

    try {
      if (initialEntry?.id) {
        const res = await api.updateEntry(initialEntry.id, entryData);
        onSave(res.entry);
      } else {
        const res = await api.createEntry(entryData);
        onSave(res.entry);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save entry');
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xl overflow-hidden flex flex-col max-w-4xl mx-auto">
      {/* Top Header Bar */}
      <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4 bg-stone-50/70 dark:bg-stone-900/60">
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={e => {
              setDate(e.target.value);
              setIsSaved(false);
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <input
            type="time"
            value={time}
            onChange={e => {
              setTime(e.target.value);
              setIsSaved(false);
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
            <Check className="w-3.5 h-3.5" />
            {isSaved ? 'Saved ✓' : 'Editing...'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-200 dark:shadow-none transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Save Diary Entry
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Rating and Primary Mood Bar */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
              Daily Rating (1–5 Stars)
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setRating(star);
                    setIsSaved(false);
                  }}
                  className="p-1 text-stone-300 dark:text-stone-600 hover:scale-110 transition cursor-pointer"
                  title={`${star} Star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : ''
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-medium text-stone-600 dark:text-stone-300 ml-2">
                {rating === 1 && 'Very difficult'}
                {rating === 2 && 'Difficult'}
                {rating === 3 && 'Okay'}
                {rating === 4 && 'Good'}
                {rating === 5 && 'Excellent'}
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-md">
            <span className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
              Primary Mood & Emotions
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {MOODS.map(m => {
                const isSelected = emotions.includes(m.name) || mood === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => {
                      setMood(m.name);
                      toggleEmotion(m.name);
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1 border ${
                      isSelected
                        ? `${m.color} border-current shadow-sm`
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Title Input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              setIsSaved(false);
            }}
            placeholder="Title of today's reflection..."
            className="w-full text-2xl md:text-3xl font-bold font-serif text-stone-900 dark:text-stone-50 placeholder:text-stone-300 dark:placeholder:text-stone-600 bg-transparent border-b border-stone-200 dark:border-stone-800 pb-2 focus:outline-none focus:border-rose-400 transition"
          />
        </div>

        {/* Rich Text Toolbar */}
        <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex flex-wrap items-center gap-1 text-stone-700 dark:text-stone-300 sticky top-0 z-20 backdrop-blur-md">
          <button
            type="button"
            onClick={() => formatDoc('bold')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => formatDoc('italic')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => formatDoc('underline')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-stone-300 dark:bg-stone-600 mx-1" />

          <button
            type="button"
            onClick={() => formatDoc('formatBlock', '<h1>')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => formatDoc('formatBlock', '<h2>')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-stone-300 dark:bg-stone-600 mx-1" />

          <button
            type="button"
            onClick={() => formatDoc('insertUnorderedList')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => formatDoc('insertOrderedList')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-stone-300 dark:bg-stone-600 mx-1" />

          <button
            type="button"
            onClick={() => formatDoc('justifyLeft')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => formatDoc('justifyCenter')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => formatDoc('justifyRight')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-stone-300 dark:bg-stone-600 mx-1" />

          {/* Emoji Picker toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition flex items-center gap-1"
              title="Insert Emoji"
            >
              <Smile className="w-4 h-4 text-amber-500" />
            </button>
            {showEmojiPicker && (
              <div className="absolute left-0 top-full mt-2 p-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl z-30 grid grid-cols-4 gap-2 w-48">
                {COMMON_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="text-lg p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="w-px h-4 bg-stone-300 dark:bg-stone-600 mx-1" />

          <button
            type="button"
            onClick={() => formatDoc('undo')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => formatDoc('redo')}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="ml-auto text-[11px] text-stone-400 dark:text-stone-500 flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
          </div>
        </div>

        {/* Rich Editable Content Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={updateCounts}
          data-placeholder="Pour your heart onto the page... How did today unfold? What thoughts are lingering with you?"
          className="min-h-[220px] max-h-[480px] overflow-y-auto px-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 diary-prose focus:outline-none focus:ring-2 focus:ring-rose-300 empty:before:content-[attr(data-placeholder)] empty:before:text-stone-400 empty:before:pointer-events-none"
        />

        {/* Media Attachments Section (Photos, Voice Recording, Music) */}
        <div className="space-y-4 pt-2 border-t border-stone-200/80 dark:border-stone-800">
          <div className="flex flex-wrap items-center gap-3">
            {/* Add Photo Button */}
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-xs font-medium text-stone-700 dark:text-stone-300 transition cursor-pointer">
              <ImageIcon className="w-4 h-4 text-rose-500" />
              <span>Attach Photos ({photos.length})</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>

            {/* Voice Diary Buttons */}
            {!isRecording && !voiceRecording && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startRecording}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-xs font-medium text-stone-700 dark:text-stone-300 transition cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-amber-500" />
                  <span>Record Voice Note</span>
                </button>

                <button
                  type="button"
                  onClick={handleUseSampleVoiceNote}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100/70 text-xs font-medium text-amber-800 dark:text-amber-300 transition cursor-pointer"
                  title="Attach a ready sample audio reflection to test playback and transcription"
                >
                  <span>🎙️ Sample Voice Note</span>
                </button>

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-xs font-medium text-stone-700 dark:text-stone-300 transition cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-stone-400" />
                  <span>Upload Audio Note</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Music of the day */}
            {!musicAttachment && (
              <button
                type="button"
                onClick={() => setShowMusicModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-xs font-medium text-stone-700 dark:text-stone-300 transition cursor-pointer"
              >
                <Music className="w-4 h-4 text-purple-500" />
                <span>Song of the Day</span>
              </button>
            )}

            {/* AI Action: Analyze emotion & sentiment */}
            <button
              type="button"
              onClick={handleAnalyzeEntry}
              disabled={isAnalyzingAi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-xs font-medium text-stone-700 dark:text-stone-300 transition cursor-pointer"
            >
              {isAnalyzingAi ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              ) : (
                <Smile className="w-4 h-4 text-emerald-500" />
              )}
              <span>Analyze Emotions</span>
            </button>

            {/* AI Action: Reflect on my entry */}
            <button
              type="button"
              onClick={handleGenerateReflection}
              disabled={isGeneratingReflection}
              className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/40 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:shadow-sm transition cursor-pointer"
            >
              {isGeneratingReflection ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-500" />
              )}
              <span>✨ Reflect on my entry</span>
            </button>
          </div>

          {/* AI Notice Banner */}
          {aiNotice && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start justify-between gap-3 transition-all ${
                aiNotice.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : aiNotice.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-relaxed">{aiNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setAiNotice(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Microphone Error Alert Banner */}
          {micError && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <span className="font-semibold block">{micError}</span>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={handleUseSampleVoiceNote}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs cursor-pointer shadow-xs transition"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Use Sample Voice Note</span>
                    </button>
                    <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-800 hover:bg-amber-50 text-amber-900 dark:text-amber-200 font-medium text-xs cursor-pointer shadow-xs transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Audio File</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-300 hover:underline cursor-pointer"
                    >
                      Try Microphone Again
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMicError(null)}
                className="text-amber-700 dark:text-amber-400 hover:text-amber-900 p-1 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active Voice Recording Bar */}
          {isRecording && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
                <div>
                  <span className="text-xs font-bold text-amber-950 dark:text-amber-100 block">
                    🎙️ Recording Voice Diary ({Math.floor(recordingSeconds / 60)}:
                    {String(recordingSeconds % 60).padStart(2, '0')})
                  </span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300">
                    {isPaused ? 'Paused' : 'Listening & capturing voice...'}
                  </span>
                </div>

                {/* Animated sound wave bars */}
                <div className="flex items-center gap-1 h-6 ml-2">
                  {[40, 80, 50, 100, 60, 90, 45, 75].map((h, i) => (
                    <span
                      key={i}
                      style={{ height: isPaused ? '4px' : `${h}%` }}
                      className="w-1 bg-rose-500 rounded-full transition-all duration-300"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={pauseResumeRecording}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-stone-800 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100/60 transition flex items-center gap-1.5"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop & Attach</span>
                </button>
              </div>
            </div>
          )}

          {/* Attached Voice Recording Player */}
          {voiceRecording && !isRecording && (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
                  <Volume2 className="w-4 h-4 text-amber-500" />
                  <span>Voice Diary ({voiceRecording.duration ? `${voiceRecording.duration}s` : 'Audio note'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTranscribeAudio}
                    disabled={isTranscribing}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-medium hover:bg-amber-200 transition flex items-center gap-1"
                  >
                    {isTranscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                    <span>Convert to Text</span>
                  </button>
                  <button
                    type="button"
                    onClick={deleteRecording}
                    className="text-stone-400 hover:text-rose-500 transition p-1"
                    title="Remove voice recording"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <audio controls src={voiceRecording.url} className="w-full h-8" />
              {voiceRecording.transcript && (
                <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300">
                  <span className="font-semibold text-stone-800 dark:text-stone-200 block mb-1">Transcript:</span>
                  <p className="italic">{voiceRecording.transcript}</p>
                </div>
              )}
            </div>
          )}

          {/* Music Attachment Player */}
          {musicAttachment && (
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-200 dark:bg-purple-900/80 flex items-center justify-center text-purple-700 dark:text-purple-300">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-purple-900 dark:text-purple-200 block">
                    🎵 {musicAttachment.title}
                  </span>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400">
                    {musicAttachment.artist}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <audio controls src={musicAttachment.url} className="h-7 w-48" />
                <button
                  type="button"
                  onClick={() => {
                    setMusicAttachment(undefined);
                    setIsSaved(false);
                  }}
                  className="text-purple-400 hover:text-rose-500 transition p-1"
                  title="Remove music"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Photos Preview Gallery */}
          {photos.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
                Attached Photos ({photos.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map(photo => (
                  <div
                    key={photo.id}
                    className="relative group rounded-2xl overflow-hidden aspect-square border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Diary photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-stone-900/70 text-white hover:bg-rose-600 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Emotion & Sentiment Breakdown */}
          {(aiEmotions || aiSentiment) && (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  AI Emotion & Sentiment Detection
                </span>
                <span className="text-[10px] text-stone-400">AI interpretation</span>
              </div>

              {aiEmotions && aiEmotions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">Detected emotions:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {aiEmotions.map((emo, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-stone-700 dark:text-stone-300">{emo.emotion}</span>
                        <span className="font-semibold text-rose-500">{emo.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiSentiment && (
                <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      Overall Sentiment:
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                        aiSentiment.sentiment === 'Positive'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : aiSentiment.sentiment === 'Negative'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300'
                      }`}
                    >
                      {aiSentiment.sentiment}
                    </span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-400">{aiSentiment.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* AI Reflection Card */}
          {aiReflection && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50/70 via-amber-50/50 to-orange-50/40 dark:from-rose-950/30 dark:via-amber-950/20 dark:to-stone-900 border border-rose-200/80 dark:border-rose-900/60 space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5 font-serif">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  AI Companion Reflection
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateReflection}
                    disabled={isGeneratingReflection}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAiReflection(undefined);
                      setIsSaved(false);
                    }}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                    title="Remove reflection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm italic font-serif leading-relaxed text-stone-800 dark:text-stone-200">
                “{aiReflection}”
              </p>
              <span className="text-[10px] text-stone-400 block">
                Reflections are supportive thoughts generated to encourage mindful self-inquiry.
              </span>
            </div>
          )}

          {/* Tags and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
                Tags
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 min-h-[42px]">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder={tags.length === 0 ? 'Type tag and press Enter...' : ''}
                  className="flex-1 min-w-[120px] bg-transparent text-xs text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1.5">
                Location (Optional)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={locationName}
                  onChange={e => {
                    setLocationName(e.target.value);
                    setIsSaved(false);
                  }}
                  placeholder="e.g. Garden Porch, Home, Tokyo Café"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Music Modal */}
      {showMusicModal && (
        <MusicModal
          onSelect={music => {
            setMusicAttachment(music);
            setShowMusicModal(false);
            setIsSaved(false);
          }}
          onClose={() => setShowMusicModal(false)}
        />
      )}
    </div>
  );
};

// Simple helper modal for attaching music
const MusicModal: React.FC<{
  onSelect: (music: MusicAttachment) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  const PRESETS = [
    {
      title: 'Gentle Rain & Calm Waters',
      artist: 'Ambient Nature',
      url: 'https://actions.google.com/sounds/v1/water/gentle_rain_loop.ogg',
    },
    {
      title: 'Soft Morning Breeze',
      artist: 'Autumn Acoustic',
      url: 'https://actions.google.com/sounds/v1/weather/wind_breeze.ogg',
    },
    {
      title: 'Campfire Reflections',
      artist: 'Cozy Hearth',
      url: 'https://actions.google.com/sounds/v1/ambiences/campfire.ogg',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTitle(file.name.replace(/\.[^/.]+$/, ''));
    setArtist('Personal Audio');
    const reader = new FileReader();
    reader.onload = () => {
      setAudioUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!title || !audioUrl) {
      alert('Please provide song title and audio.');
      return;
    }
    onSelect({
      id: `music-${Date.now()}`,
      title: title.trim(),
      artist: artist.trim() || 'Unknown Artist',
      url: audioUrl,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-500" />
            Attach Song of the Day
          </h3>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Calming Sounds */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
            Choose from Calming Sounds:
          </span>
          <div className="space-y-1.5">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTitle(p.title);
                  setArtist(p.artist);
                  setAudioUrl(p.url);
                }}
                className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                  audioUrl === p.url
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200'
                    : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                <div>
                  <span className="font-semibold block">{p.title}</span>
                  <span className="text-stone-400">{p.artist}</span>
                </div>
                <Play className="w-3.5 h-3.5 text-stone-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Or Upload Custom Audio */}
        <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block">
            Or upload your own audio file:
          </span>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="text-xs text-stone-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
              Song Name
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Weightless"
              className="w-full px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
              Artist Name
            </label>
            <input
              type="text"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              placeholder="e.g. Marconi Union"
              className="w-full px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title || !audioUrl}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            Attach Song
          </button>
        </div>
      </div>
    </div>
  );
};
