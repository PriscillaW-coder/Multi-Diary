import type {
  DiaryEntry,
  UserProfile,
  UserPrivacySettings,
  Reminder,
  AIInsight,
  SearchFilters,
  YearInReviewReport,
} from '../types/diary';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('multidiary_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An unexpected error occurred');
  }

  return data as T;
}

export const api = {
  // Auth
  async register(name: string, email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    return request<{ user: UserProfile; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    return request<{ user: UserProfile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('multidiary_token');
    }
  },

  async getMe(): Promise<{ user: UserProfile }> {
    return request<{ user: UserProfile }>('/auth/me');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  },

  async updatePrivacySettings(
    privacySettings: Partial<UserPrivacySettings>,
    themePreference?: 'light' | 'dark' | 'system'
  ): Promise<{ user: UserProfile }> {
    return request<{ user: UserProfile }>('/auth/privacy-settings', {
      method: 'PUT',
      body: JSON.stringify({ privacySettings, themePreference }),
    });
  },

  async deleteAccount(): Promise<{ success: boolean }> {
    const res = await request<{ success: boolean }>('/auth/account', { method: 'DELETE' });
    localStorage.removeItem('multidiary_token');
    return res;
  },

  async seedDemoMemories(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/auth/seed-demo', { method: 'POST' });
  },

  // Diary Entries
  async getEntries(filters?: SearchFilters): Promise<{ entries: DiaryEntry[] }> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.query) params.append('search', filters.query);
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.moods && filters.moods.length > 0) params.append('mood', filters.moods[0]);
      if (filters.ratings && filters.ratings.length > 0) params.append('rating', filters.ratings[0].toString());
      if (filters.hasPhotos) params.append('hasPhotos', 'true');
      if (filters.hasVoice) params.append('hasVoice', 'true');
      if (filters.isArchived !== undefined) params.append('archived', filters.isArchived.toString());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ entries: DiaryEntry[] }>(`/entries${query}`);
  },

  async getEntryById(id: string): Promise<{ entry: DiaryEntry }> {
    return request<{ entry: DiaryEntry }>(`/entries/${id}`);
  },

  async createEntry(entry: Partial<DiaryEntry> & { autoAnalyze?: boolean }): Promise<{ entry: DiaryEntry }> {
    return request<{ entry: DiaryEntry }>('/entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  async updateEntry(id: string, updates: Partial<DiaryEntry>): Promise<{ entry: DiaryEntry }> {
    return request<{ entry: DiaryEntry }>(`/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteEntry(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/entries/${id}`, {
      method: 'DELETE',
    });
  },

  async duplicateEntry(id: string): Promise<{ entry: DiaryEntry }> {
    return request<{ entry: DiaryEntry }>(`/entries/${id}/duplicate`, {
      method: 'POST',
    });
  },

  async archiveEntry(id: string): Promise<{ entry: DiaryEntry }> {
    return request<{ entry: DiaryEntry }>(`/entries/${id}/archive`, {
      method: 'POST',
    });
  },

  async generateEntryReflection(id: string): Promise<{ entry: DiaryEntry; reflection: any }> {
    return request<{ entry: DiaryEntry; reflection: any }>(`/entries/${id}/reflection`, {
      method: 'POST',
    });
  },

  async getOnThisDay(): Promise<{ memories: DiaryEntry[] }> {
    return request<{ memories: DiaryEntry[] }>('/on-this-day');
  },

  // Reminders
  async getReminders(): Promise<{ reminders: Reminder[] }> {
    return request<{ reminders: Reminder[] }>('/reminders');
  },

  async createReminder(reminder: Partial<Reminder>): Promise<{ reminder: Reminder }> {
    return request<{ reminder: Reminder }>('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder),
    });
  },

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<{ reminder: Reminder }> {
    return request<{ reminder: Reminder }>(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteReminder(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/reminders/${id}`, {
      method: 'DELETE',
    });
  },

  // AI Services
  async analyzeEmotionAndSentiment(text: string): Promise<{ analysis: { emotions: any[]; sentiment: any } }> {
    return request<{ analysis: { emotions: any[]; sentiment: any } }>('/ai/emotion-sentiment', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async getAiReflection(params: {
    title: string;
    plainTextContent: string;
    rating?: number;
    mood?: string;
    date?: string;
    entryId?: string;
  }): Promise<{ reflection: string }> {
    return request<{ reflection: string }>('/ai/reflect', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getAiPrompt(currentMood?: string): Promise<{ prompt: string }> {
    return request<{ prompt: string }>('/ai/prompt', {
      method: 'POST',
      body: JSON.stringify({ currentMood }),
    });
  },

  async getAiInsights(): Promise<{ insights: AIInsight[] }> {
    return request<{ insights: AIInsight[] }>('/ai/insights');
  },

  async refreshAiInsights(): Promise<{ insights: AIInsight[] }> {
    return request<{ insights: AIInsight[] }>('/ai/insights/refresh', {
      method: 'POST',
    });
  },

  async transcribeAudio(audioData: string, mimeType?: string): Promise<{ transcript: string }> {
    return request<{ transcript: string }>('/ai/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audioData, mimeType }),
    });
  },

  async getYearInReview(year: number): Promise<{ report: YearInReviewReport }> {
    return request<{ report: YearInReviewReport }>('/ai/year-in-review', {
      method: 'POST',
      body: JSON.stringify({ year }),
    });
  },
};
