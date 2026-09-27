export type MoodType =
  | 'Happy'
  | 'Sad'
  | 'Angry'
  | 'Excited'
  | 'Calm'
  | 'Anxious'
  | 'Lonely'
  | 'Grateful'
  | 'Motivated'
  | 'Tired'
  | 'Stressed'
  | 'Confused'
  | 'Loved'
  | 'Neutral';

export interface PhotoAttachment {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: string;
}

export interface VoiceAttachment {
  id: string;
  url: string; // base64 or audio blob url
  duration?: number; // seconds
  transcript?: string;
  createdAt: string;
}

export interface MusicAttachment {
  id: string;
  title: string;
  artist: string;
  url: string; // base64 or audio stream url
}

export interface AiEmotion {
  emotion: string;
  percentage: number;
}

export interface AiSentiment {
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  explanation: string;
}

export interface AiReflection {
  text: string;
  generatedAt: string;
  promptUsed?: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  title: string;
  content: string; // rich text HTML
  plainTextContent: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  rating: number; // 1 to 5
  mood: MoodType;
  emotions: string[];
  tags: string[];
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  photos: PhotoAttachment[];
  voiceRecording?: VoiceAttachment;
  musicAttachment?: MusicAttachment;
  aiReflection?: AiReflection;
  aiEmotions?: AiEmotion[];
  aiSentiment?: AiSentiment;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPrivacySettings {
  aiDiaryAnalysis: boolean;
  emotionDetection: boolean;
  personalizedInsights: boolean;
  aiReflections: boolean;
  voiceTranscriptAnalysis: boolean;
  includeMediaInAiAnalysis: boolean;
  allowLocationTagging: boolean;
  biometricLockMock?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  privacySettings: UserPrivacySettings;
  themePreference: 'light' | 'dark' | 'system';
}

export interface Reminder {
  id: string;
  userId: string;
  reminderTime: string; // HH:mm
  frequency: 'daily' | 'weekly' | 'custom';
  daysOfWeek?: number[]; // 0 for Sunday, 6 for Saturday
  message: string;
  enabled: boolean;
  createdAt: string;
}

export interface AIInsight {
  id: string;
  userId: string;
  text: string;
  category: 'pattern' | 'mood' | 'milestone' | 'growth';
  date: string;
}

export interface YearInReviewReport {
  year: number;
  totalEntries: number;
  averageRating: number;
  mostCommonMood: string;
  moodBreakdown: Record<string, number>;
  totalPhotos: number;
  totalVoiceRecordings: number;
  topThemes: string[];
  highestRatedMemories: Array<{
    id: string;
    title: string;
    date: string;
    rating: number;
    mood: string;
  }>;
  aiReflection: string;
  generatedAt: string;
}

export interface SearchFilters {
  query?: string;
  dateRange?: 'all' | 'today' | 'this_week' | 'this_month' | 'custom';
  startDate?: string;
  endDate?: string;
  moods?: MoodType[];
  ratings?: number[];
  tags?: string[];
  hasPhotos?: boolean;
  hasVoice?: boolean;
  hasMusic?: boolean;
  isArchived?: boolean;
}
