import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Sparkles,
  User,
  Trash2,
  Check,
  AlertTriangle,
  Moon,
  Sun,
  KeyRound,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { UserPrivacySettings } from '../types/diary';

export const SettingsView: React.FC = () => {
  const { user, updatePrivacySettings, changePassword, deleteAccount, seedDemoMemories } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Local settings copy
  const [settings, setSettings] = useState<UserPrivacySettings>(
    user?.privacySettings || {
      aiDiaryAnalysis: true,
      emotionDetection: true,
      personalizedInsights: true,
      aiReflections: true,
      voiceTranscriptAnalysis: true,
      includeMediaInAiAnalysis: false,
      allowLocationTagging: true,
      biometricLockMock: false,
    }
  );

  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  const handleToggle = async (key: keyof UserPrivacySettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await updatePrivacySettings(updated);
      setSavedSettingsNotice(true);
      setTimeout(() => setSavedSettingsNotice(false), 2000);
    } catch (e) {
      alert('Failed to update privacy settings');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    setIsChangingPass(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      setPasswordStatus({ type: 'success', message: res.message });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message || 'Failed to change password' });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      alert('Failed to delete account');
      setIsDeleting(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      await seedDemoMemories();
      alert('Sample reflective memories have been added to your timeline! ✓');
    } catch (err) {
      alert('Failed to seed memories');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-serif text-stone-900 dark:text-stone-50">
              Privacy, Security & Settings
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Control your account security, AI analysis preferences, and personal sanctuary options
            </p>
          </div>
        </div>

        {savedSettingsNotice && (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
            <Check className="w-3.5 h-3.5" />
            Preferences Saved ✓
          </span>
        )}
      </div>

      {/* Account Profile info */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-2">
          <User className="w-4 h-4 text-rose-500" />
          Account Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700">
            <span className="text-stone-400 block mb-0.5">Account Name</span>
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">{user?.name}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700">
            <span className="text-stone-400 block mb-0.5">Email (Private Identifier)</span>
            <span className="text-sm font-bold text-stone-900 dark:text-stone-100">{user?.email}</span>
          </div>
        </div>

        {/* Theme Preference Toggle */}
        <div className="pt-2 flex items-center justify-between border-t border-stone-100 dark:border-stone-800 text-xs">
          <div>
            <span className="font-semibold text-stone-800 dark:text-stone-200 block">Appearance Mode</span>
            <span className="text-stone-400">Switch between soothing Light or Dark palette</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="px-3.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-700 transition"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span className="capitalize">{theme} Mode</span>
          </button>
        </div>
      </div>

      {/* AI Privacy Controls */}
      <div className="p-6 md:p-7 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2 font-serif">
            <Sparkles className="w-4 h-4 text-rose-500" />
            AI Privacy Controls
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            You maintain full sovereignty over how AI interacts with your private diary content.
            When any feature is switched OFF, no diary content is transmitted for that purpose.
          </p>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
          {/* Main Master Switch: AI Diary Analysis */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-stone-900 dark:text-stone-100 block">
                AI Diary Analysis
              </span>
              <span className="text-stone-500 dark:text-stone-400">
                Master toggle for analyzing diary entries, emotion detection, and suggestions
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('aiDiaryAnalysis')}
              className="text-stone-400 hover:text-stone-600 transition"
            >
              {settings.aiDiaryAnalysis ? (
                <ToggleRight className="w-8 h-8 text-rose-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-stone-300 dark:text-stone-600" />
              )}
            </button>
          </div>

          {/* Emotion Detection */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                Emotion Detection
              </span>
              <span className="text-stone-500 dark:text-stone-400">
                Linguistic analysis identifying emotional tones (happiness, calmness, stress)
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('emotionDetection')}
              disabled={!settings.aiDiaryAnalysis}
              className="text-stone-400 hover:text-stone-600 transition disabled:opacity-40"
            >
              {settings.emotionDetection && settings.aiDiaryAnalysis ? (
                <ToggleRight className="w-8 h-8 text-rose-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-stone-300 dark:text-stone-600" />
              )}
            </button>
          </div>

          {/* Personalized Insights */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                Personalized Insights
              </span>
              <span className="text-stone-500 dark:text-stone-400">
                Observes longitudinal journal trends (e.g. positive correlations with nature, restful sleep)
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('personalizedInsights')}
              disabled={!settings.aiDiaryAnalysis}
              className="text-stone-400 hover:text-stone-600 transition disabled:opacity-40"
            >
              {settings.personalizedInsights && settings.aiDiaryAnalysis ? (
                <ToggleRight className="w-8 h-8 text-rose-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-stone-300 dark:text-stone-600" />
              )}
            </button>
          </div>

          {/* AI Reflections */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                AI Reflections
              </span>
              <span className="text-stone-500 dark:text-stone-400">
                Generates warm, empathetic reflection companion notes for individual entries
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('aiReflections')}
              disabled={!settings.aiDiaryAnalysis}
              className="text-stone-400 hover:text-stone-600 transition disabled:opacity-40"
            >
              {settings.aiReflections && settings.aiDiaryAnalysis ? (
                <ToggleRight className="w-8 h-8 text-rose-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-stone-300 dark:text-stone-600" />
              )}
            </button>
          </div>

          {/* Voice Transcript Analysis */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                Voice Transcript Analysis
              </span>
              <span className="text-stone-500 dark:text-stone-400">
                Transcribes voice recordings to editable text using speech-to-text
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('voiceTranscriptAnalysis')}
              disabled={!settings.aiDiaryAnalysis}
              className="text-stone-400 hover:text-stone-600 transition disabled:opacity-40"
            >
              {settings.voiceTranscriptAnalysis && settings.aiDiaryAnalysis ? (
                <ToggleRight className="w-8 h-8 text-rose-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-stone-300 dark:text-stone-600" />
              )}
            </button>
          </div>

          {/* Include Media in AI Analysis */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                Include Photos & Audio in AI Analysis
              </span>
              <span className="text-stone-500 dark:text-stone-400">
                Allow uploaded images or audio to be referenced during reflection generation (Default: Off)
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('includeMediaInAiAnalysis')}
              disabled={!settings.aiDiaryAnalysis}
              className="text-stone-400 hover:text-stone-600 transition disabled:opacity-40"
            >
              {settings.includeMediaInAiAnalysis && settings.aiDiaryAnalysis ? (
                <ToggleRight className="w-8 h-8 text-rose-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-stone-300 dark:text-stone-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <form
        onSubmit={handleChangePassword}
        className="p-6 md:p-7 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4"
      >
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2 font-serif">
          <KeyRound className="w-4 h-4 text-rose-500" />
          Change Password
        </h3>

        {passwordStatus && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              passwordStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
            }`}
          >
            <span>{passwordStatus.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              New Password (min 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isChangingPass}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            {isChangingPass ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>

      {/* Sample Data & Account Danger Zone */}
      <div className="p-6 md:p-7 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2 font-serif">
          <Database className="w-4 h-4 text-amber-500" />
          Data & Account Sanctuary Actions
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 text-xs">
          <div>
            <span className="font-bold text-stone-800 dark:text-stone-200 block">
              Seed Starter Memories
            </span>
            <span className="text-stone-500 dark:text-stone-400">
              Populate sample memories from 2025 and 2026 to preview the Timeline, Memories Gallery, and On This Day feature
            </span>
          </div>
          <button
            type="button"
            onClick={handleSeedDemo}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-400 text-stone-800 dark:text-stone-200 font-semibold transition shrink-0"
          >
            Add Sample Memories
          </button>
        </div>

        {/* Delete Account */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs">
          <div>
            <span className="font-bold text-rose-900 dark:text-rose-200 block">
              Permanently Delete Account
            </span>
            <span className="text-rose-700/80 dark:text-rose-300">
              Irreversibly delete your account, all diary entries, photos, voice notes, and AI insights.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs transition shrink-0"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
                Are you absolutely sure?
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                This will permanently delete your account and all private diary records. This action cannot be undone.
              </p>
            </div>

            <div className="text-left space-y-1 text-xs">
              <label className="text-stone-600 dark:text-stone-400">
                Type <strong className="text-rose-600">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmText !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
