import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Plus,
  Trash2,
  Check,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import type { Reminder } from '../types/diary';

export const RemindersView: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [time, setTime] = useState('21:00');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [message, setMessage] = useState('Take a peaceful pause to reflect on your day 🌸');
  const [showAddForm, setShowAddForm] = useState(false);
  const [testNotification, setTestNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await api.getReminders();
      setReminders(res.reminders || []);
    } catch (e) {
      console.error('Failed to load reminders:', e);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || !message.trim()) return;

    try {
      const res = await api.createReminder({
        reminderTime: time,
        frequency,
        message: message.trim(),
        enabled: true,
      });
      setReminders([...reminders, res.reminder]);
      setShowAddForm(false);
      setMessage('Take a peaceful pause to reflect on your day 🌸');
    } catch (err) {
      alert('Failed to create reminder');
    }
  };

  const handleToggle = async (r: Reminder) => {
    try {
      const res = await api.updateReminder(r.id, { enabled: !r.enabled });
      setReminders(reminders.map(item => (item.id === r.id ? res.reminder : item)));
    } catch (err) {
      alert('Failed to update reminder status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteReminder(id);
      setReminders(reminders.filter(item => item.id !== id));
    } catch (err) {
      alert('Failed to delete reminder');
    }
  };

  const triggerTestNotification = (msg: string) => {
    setTestNotification(msg);
    setTimeout(() => setTestNotification(null), 5000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-serif text-stone-900 dark:text-stone-50">
              Smart Reminders
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Gentle, non-intrusive nudges to cultivate a consistent mindfulness journaling practice
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-200 dark:shadow-none transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* Simulated Notification Toast */}
      {testNotification && (
        <div className="p-4 rounded-2xl bg-rose-500 text-white shadow-xl flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-3 text-xs">
            <Bell className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold block">Multi Diary Reminder</span>
              <span>{testNotification}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTestNotification(null)}
            className="text-xs px-2 py-1 bg-white/20 rounded-lg hover:bg-white/30"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* AI Suggestion Banner */}
      <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Adaptive Pattern Suggestion
          </span>
          <p className="text-xs text-amber-900 dark:text-amber-200">
            “You usually write your diary around 9 PM. Would you like an automated evening reminder at 9 PM?”
          </p>
        </div>
        <button
          type="button"
          onClick={() => triggerTestNotification('Take a peaceful pause to reflect on your day 🌸')}
          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0"
        >
          Test Notification
        </button>
      </div>

      {/* Create Reminder Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateReminder}
          className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4"
        >
          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 font-serif">
            Create a Mindful Journaling Reminder
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Reminder Time
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly (Sundays)</option>
                <option value="custom">Custom Weekdays</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-xs text-stone-700 dark:text-stone-300 block mb-1">
              Encouraging Message
            </label>
            <input
              type="text"
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g. Take 5 minutes to celebrate yourself..."
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-sm"
            >
              Save Reminder
            </button>
          </div>
        </form>
      )}

      {/* Reminders List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Active Reminders ({reminders.length})
        </h3>

        {reminders.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-400">
            No reminders scheduled yet. Add one above to keep your journaling routine steady.
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map(r => (
              <div
                key={r.id}
                className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-stone-900 dark:text-stone-100">
                      {r.reminderTime}
                    </span>
                    <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                      {r.frequency}
                    </span>
                    {!r.enabled && (
                      <span className="text-[10px] text-stone-400 italic">Paused</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    “{r.message}”
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(r)}
                    className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                    title={r.enabled ? 'Pause reminder' : 'Enable reminder'}
                  >
                    {r.enabled ? (
                      <ToggleRight className="w-6 h-6 text-rose-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-stone-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="p-2 text-stone-400 hover:text-rose-500"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
