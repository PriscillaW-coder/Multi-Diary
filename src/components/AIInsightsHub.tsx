import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  RefreshCw,
  Award,
  Calendar,
  Star,
  Image as ImageIcon,
  Mic,
  BookOpen,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import type { AIInsight, YearInReviewReport } from '../types/diary';

export const AIInsightsHub: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [yearReport, setYearReport] = useState<YearInReviewReport | null>(null);
  const [isGeneratingYearReport, setIsGeneratingYearReport] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await api.getAiInsights();
      setInsights(res.insights || []);
    } catch (e) {
      console.error('Failed to fetch insights:', e);
    }
  };

  const handleRefreshInsights = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.refreshAiInsights();
      setInsights(res.insights || []);
    } catch (err: any) {
      alert(err.message || 'Failed to refresh insights');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateYearReview = async () => {
    setIsGeneratingYearReport(true);
    try {
      const res = await api.getYearInReview(selectedYear);
      setYearReport(res.report);
    } catch (err: any) {
      alert(err.message || 'Failed to generate Year in Review');
    } finally {
      setIsGeneratingYearReport(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-serif text-stone-900 dark:text-stone-50">
              AI Insights & Annual Reflections
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Personalized reflections on your diary history, writing patterns, and yearly milestones
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefreshInsights}
          disabled={isRefreshing}
          className="px-4 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-rose-400 text-xs font-semibold text-stone-800 dark:text-stone-200 transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Observations</span>
        </button>
      </div>

      {/* Observations Cards Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-50">
          Personalized Observations
        </h2>

        {insights.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
            <p className="text-sm text-stone-400">
              Continue journaling to generate personalized observations and patterns.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins, idx) => (
              <div
                key={ins.id || idx}
                className="p-5 md:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                      {ins.category}
                    </span>
                    <span className="text-stone-400 text-[11px]">{ins.date}</span>
                  </div>
                  <p className="text-sm text-stone-700 dark:text-stone-200 leading-relaxed font-serif">
                    “{ins.text}”
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <span className="text-[11px] text-stone-400 block pt-1 italic">
          * Observations are based purely on your recorded journal entries and do not constitute psychological or medical advice.
        </span>
      </div>

      {/* Extra Feature: Year in Review Generator */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-amber-50/70 via-rose-50/40 to-stone-50 dark:from-stone-900 dark:via-stone-900 dark:to-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 dark:border-amber-900/40 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Annual Milestone Feature
            </span>
            <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Year in Review Summary
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Synthesize your year's memories, ratings, photo moments, and an overarching annual reflection
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 shadow-xs"
            >
              {[2026, 2025, 2024].map(y => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleGenerateYearReview}
              disabled={isGeneratingYearReport}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-200 dark:shadow-none transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingYearReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Year In Review Display */}
        {yearReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span className="text-[11px] text-stone-400 uppercase font-semibold block">Total Entries</span>
                <span className="text-2xl font-bold font-serif text-stone-900 dark:text-stone-50">
                  {yearReport.totalEntries}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span className="text-[11px] text-stone-400 uppercase font-semibold block">Average Rating</span>
                <span className="text-2xl font-bold font-serif text-amber-500">
                  {yearReport.averageRating} / 5 ⭐
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span className="text-[11px] text-stone-400 uppercase font-semibold block">Top Emotion</span>
                <span className="text-2xl font-bold font-serif text-rose-500">
                  {yearReport.mostCommonMood}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span className="text-[11px] text-stone-400 uppercase font-semibold block">Photos Captured</span>
                <span className="text-2xl font-bold font-serif text-emerald-500">
                  {yearReport.totalPhotos}
                </span>
              </div>
            </div>

            {/* AI Annual Reflection */}
            <div className="p-6 rounded-3xl bg-white dark:bg-stone-800 border border-amber-200 dark:border-stone-700 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-serif">
                <Sparkles className="w-4 h-4 text-amber-500" />
                AI Reflection on {yearReport.year}
              </span>
              <p className="text-sm md:text-base font-serif italic text-stone-800 dark:text-stone-100 leading-relaxed">
                “{yearReport.aiReflection}”
              </p>
            </div>

            {/* Highest-rated memories from this year */}
            {yearReport.highestRatedMemories.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
                  Treasured Moments of {yearReport.year}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {yearReport.highestRatedMemories.map(m => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-800 dark:text-stone-200 block font-serif">
                          {m.title}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {m.date} • {m.mood}
                        </span>
                      </div>
                      <span className="text-amber-400 font-bold">★ {m.rating}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
