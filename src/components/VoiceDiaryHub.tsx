import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  FileText,
  Plus,
  Loader2,
  Volume2,
  Sparkles,
  ArrowRight,
  Upload,
  AlertCircle,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import {
  getSupportedAudioMimeType,
  getFriendlyAudioErrorMessage,
  createSafeMediaRecorder,
  createSampleVoiceRecording,
} from '../utils/audioRecorder';
import type { DiaryEntry, VoiceAttachment } from '../types/diary';

interface VoiceDiaryHubProps {
  onTurnIntoEntry: (voiceAttachment: VoiceAttachment) => void;
  onOpenEntry: (entry: DiaryEntry) => void;
}

export const VoiceDiaryHub: React.FC<VoiceDiaryHubProps> = ({
  onTurnIntoEntry,
  onOpenEntry,
}) => {
  const [entriesWithVoice, setEntriesWithVoice] = useState<DiaryEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [newRecording, setNewRecording] = useState<VoiceAttachment | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const recordingSecondsRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchVoiceEntries();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const fetchVoiceEntries = async () => {
    try {
      const res = await api.getEntries({ hasVoice: true, isArchived: false });
      setEntriesWithVoice(res.entries || []);
    } catch (e) {
      console.error('Failed to fetch voice entries:', e);
    }
  };

  const startRecording = async () => {
    setMicError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support microphone capture. Please upload an audio file or try the Sample Voice Note.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = createSafeMediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const finalType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        const reader = new FileReader();
        const durationSnapshot = recordingSecondsRef.current;
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setNewRecording({
            id: `voice-${Date.now()}`,
            url: base64data,
            duration: durationSnapshot > 0 ? durationSnapshot : undefined,
            createdAt: new Date().toISOString(),
          });
        };
        reader.readAsDataURL(audioBlob);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      setNewRecording(null);
      setEditableTranscript('');

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(s => {
          const next = s + 1;
          recordingSecondsRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone recording error:', err);
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
        console.warn('Error stopping recorder in VoiceDiaryHub:', e);
      }
    }
    setIsRecording(false);
    setIsPaused(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const handleUseSampleVoiceNote = () => {
    const sample = createSampleVoiceRecording();
    setNewRecording({
      id: `voice-${Date.now()}`,
      url: sample.url,
      duration: sample.duration,
      transcript: sample.transcript,
      createdAt: new Date().toISOString(),
    });
    setEditableTranscript(sample.transcript);
    setMicError(null);
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMicError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64data = reader.result as string;
      setNewRecording({
        id: `voice-${Date.now()}`,
        url: base64data,
        duration: undefined,
        createdAt: new Date().toISOString(),
      });
      setEditableTranscript('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTranscribe = async () => {
    if (!newRecording?.url) return;
    setIsTranscribing(true);
    try {
      const res = await api.transcribeAudio(newRecording.url, 'audio/webm');
      setEditableTranscript(res.transcript);
      setNewRecording({ ...newRecording, transcript: res.transcript });
    } catch (err: any) {
      alert(err.message || 'Speech transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCreateEntryFromVoice = () => {
    if (!newRecording) return;
    const finalRecording: VoiceAttachment = {
      ...newRecording,
      transcript: editableTranscript.trim() || newRecording.transcript,
    };
    onTurnIntoEntry(finalRecording);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-serif text-stone-900 dark:text-stone-50">
              Voice Diary Sanctuary
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Speak your mind freely, listen back, and transcribe to written journal entries
            </p>
          </div>
        </div>

        {!isRecording && !newRecording && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={startRecording}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-200 dark:shadow-none transition flex items-center gap-2 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Record Voice Note</span>
            </button>

            <button
              type="button"
              onClick={handleUseSampleVoiceNote}
              className="px-3.5 py-2 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100/70 text-amber-800 dark:text-amber-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="Test voice diary features with a ready audio sample"
            >
              <span>🎙️ Try Sample Voice Note</span>
            </button>

            <label className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-stone-700 dark:text-stone-300 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-stone-400" />
              <span>Upload Audio Memo</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Mic Error Banner */}
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
            className="text-amber-700 dark:text-amber-400 hover:text-amber-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Recording Studio Box */}
      {isRecording && (
        <div className="p-8 rounded-3xl bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 dark:from-stone-900 dark:via-rose-950/20 dark:to-stone-900 border border-rose-200 dark:border-rose-900/60 shadow-lg text-center space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              Recording Voice Diary
            </div>
            <div className="text-4xl font-bold font-mono text-stone-900 dark:text-stone-100">
              {Math.floor(recordingSeconds / 60)}:
              {String(recordingSeconds % 60).padStart(2, '0')}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Speak softly and authentically. Your words remain completely private.
            </p>
          </div>

          {/* Animated Soundwave visualizer */}
          <div className="flex items-center justify-center gap-1.5 h-12">
            {[40, 70, 30, 90, 60, 100, 50, 80, 45, 95, 35, 75].map((h, i) => (
              <span
                key={i}
                style={{ height: isPaused ? '10px' : `${h}%` }}
                className="w-1.5 bg-rose-500 rounded-full transition-all duration-300"
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={pauseResumeRecording}
              className="px-4 py-2.5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 transition flex items-center gap-2"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Square className="w-4 h-4" />
              <span>Stop & Process</span>
            </button>
          </div>
        </div>
      )}

      {/* Review Finished Voice Recording */}
      {newRecording && !isRecording && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" />
              Fresh Voice Diary ({newRecording.duration ? `${newRecording.duration}s` : 'Audio Memo'})
            </span>
            <button
              type="button"
              onClick={() => setNewRecording(null)}
              className="text-xs text-stone-400 hover:text-rose-500"
            >
              Discard
            </button>
          </div>

          <audio controls src={newRecording.url} className="w-full" />

          {/* Transcription section */}
          <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-500" />
                Speech-to-Text Transcription
              </span>
              <button
                type="button"
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition flex items-center gap-1.5 cursor-pointer"
              >
                {isTranscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{editableTranscript ? 'Re-transcribe' : 'Convert to Text'}</span>
              </button>
            </div>

            {editableTranscript && (
              <div className="space-y-1.5">
                <span className="text-[11px] text-stone-400">
                  Editable transcript (feel free to polish before creating your entry):
                </span>
                <textarea
                  rows={4}
                  value={editableTranscript}
                  onChange={e => setEditableTranscript(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            )}
          </div>

          {/* Action button: Turn into written diary entry */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleCreateEntryFromVoice}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-200 dark:shadow-none transition flex items-center gap-2 cursor-pointer"
            >
              <span>Create Diary Entry with Voice Note</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Existing Voice Diary Entries */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-50">
          Recorded Voice Reflections ({entriesWithVoice.length})
        </h3>

        {entriesWithVoice.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
            <p className="text-xs text-stone-400">No voice diary entries recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entriesWithVoice.map(entry => (
              <div
                key={entry.id}
                onClick={() => onOpenEntry(entry)}
                className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-purple-300 dark:hover:border-purple-900 hover:shadow-md transition cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>
                    {entry.date} at {entry.time}
                  </span>
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
                    Mood: {entry.mood}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif">
                  {entry.title}
                </h4>

                {entry.voiceRecording && (
                  <audio controls src={entry.voiceRecording.url} className="w-full h-8" />
                )}

                {entry.voiceRecording?.transcript && (
                  <p className="text-xs text-stone-600 dark:text-stone-400 italic line-clamp-2">
                    “{entry.voiceRecording.transcript}”
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
