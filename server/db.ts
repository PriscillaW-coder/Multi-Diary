import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { DiaryEntry, Reminder, AIInsight, UserPrivacySettings, UserProfile } from '../src/types/diary';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  privacySettings: UserPrivacySettings;
  themePreference: 'light' | 'dark' | 'system';
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
  entries: DiaryEntry[];
  reminders: Reminder[];
  insights: AIInsight[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'multidiary.json');

export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch (err) {
    return false;
  }
}

export const defaultPrivacySettings: UserPrivacySettings = {
  aiDiaryAnalysis: true,
  emotionDetection: true,
  personalizedInsights: true,
  aiReflections: true,
  voiceTranscriptAnalysis: true,
  includeMediaInAiAnalysis: false,
  allowLocationTagging: true,
  biometricLockMock: false,
};

class Database {
  private data: DatabaseSchema = {
    users: [],
    sessions: [],
    entries: [],
    reminders: [],
    insights: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(content);
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (e) {
      console.error('Error initializing database, using in-memory store:', e);
      this.seedInitialData();
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database to file:', err);
    }
  }

  private seedInitialData() {
    // Seed default user Priscilla
    const { hash, salt } = hashPassword('diary123');
    const priscillaId = 'user-priscilla-demo';
    const now = new Date().toISOString();

    const priscilla: UserRecord = {
      id: priscillaId,
      name: 'Priscilla',
      email: 'priscillawinniezharengi@gmail.com',
      passwordHash: hash,
      salt: salt,
      createdAt: '2025-01-01T00:00:00.00Z',
      privacySettings: { ...defaultPrivacySettings },
      themePreference: 'light',
    };

    // Add sample memories for Priscilla
    const entries: DiaryEntry[] = [
      {
        id: 'entry-seed-1',
        userId: priscillaId,
        title: 'Starting a new chapter in my life',
        content: '<h1>Starting Fresh</h1><p>Today marks the beginning of something really special. I spent the morning sitting by the garden, sipping my favorite chamomile tea, and setting my intentions for the future. The morning light felt golden and calm.</p><p>It is scary to let go of old routines, but there is so much peace in trusting where life is taking me.</p>',
        plainTextContent: 'Today marks the beginning of something really special. I spent the morning sitting by the garden, sipping my favorite chamomile tea, and setting my intentions for the future. The morning light felt golden and calm. It is scary to let go of old routines, but there is so much peace in trusting where life is taking me.',
        date: '2025-09-27', // Exactly 1 year ago from today (2026-09-27) for "On This Day"!
        time: '09:30',
        rating: 5,
        mood: 'Grateful',
        emotions: ['Grateful', 'Calm', 'Loved'],
        tags: ['life', 'new-beginnings', 'peace'],
        location: { name: 'Botanical Garden & Veranda' },
        photos: [
          {
            id: 'photo-1',
            url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
            caption: 'Golden morning light by the veranda',
            uploadedAt: '2025-09-27T09:45:00.000Z',
          }
        ],
        musicAttachment: {
          id: 'music-1',
          title: 'Weightless & Gentle',
          artist: 'Ambient Mornings',
          url: 'https://actions.google.com/sounds/v1/water/gentle_rain_loop.ogg',
        },
        aiReflection: {
          text: 'Looking back at this moment, you embraced uncertainty with warmth and self-trust. Taking time for quiet contemplation before big shifts often provides the grounding you need.',
          generatedAt: '2025-09-27T10:00:00.000Z',
        },
        aiEmotions: [
          { emotion: 'Gratitude', percentage: 70 },
          { emotion: 'Peace', percentage: 20 },
          { emotion: 'Excitement', percentage: 10 },
        ],
        aiSentiment: {
          sentiment: 'Positive',
          explanation: 'Deeply reflective and hopeful tone embracing life transitions with calmness.',
        },
        createdAt: '2025-09-27T09:30:00.000Z',
        updatedAt: '2025-09-27T09:30:00.000Z',
      },
      {
        id: 'entry-seed-2',
        userId: priscillaId,
        title: 'Started a new project & creative momentum',
        content: '<h1>Creative Flow</h1><p>Finally sat down to architect the new design. Everything clicked together naturally after hours of sketching. Team discussions were encouraging, and I feel energized about the roadmap ahead.</p>',
        plainTextContent: 'Finally sat down to architect the new design. Everything clicked together naturally after hours of sketching. Team discussions were encouraging, and I feel energized about the roadmap ahead.',
        date: '2026-09-25',
        time: '16:45',
        rating: 4,
        mood: 'Excited',
        emotions: ['Excited', 'Motivated'],
        tags: ['work', 'creative', 'projects'],
        location: { name: 'Design Studio' },
        photos: [
          {
            id: 'photo-2',
            url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1000&q=80',
            caption: 'Workspace brainstorm sketches',
            uploadedAt: '2026-09-25T16:50:00.000Z',
          }
        ],
        aiReflection: {
          text: 'Your creative energy flourished today when ideas transitioned from thoughts to concrete steps. Acknowledging collaborative wins strengthens your momentum.',
          generatedAt: '2026-09-25T17:00:00.000Z',
        },
        aiEmotions: [
          { emotion: 'Excitement', percentage: 65 },
          { emotion: 'Motivation', percentage: 35 },
        ],
        aiSentiment: {
          sentiment: 'Positive',
          explanation: 'Inspiring and constructive day marked by creative achievement.',
        },
        createdAt: '2026-09-25T16:45:00.000Z',
        updatedAt: '2026-09-25T16:45:00.000Z',
      },
      {
        id: 'entry-seed-3',
        userId: priscillaId,
        title: 'Quiet Sunday walk & voice reflections',
        content: '<h1>Breathe in Autumn</h1><p>A misty morning walk along the park path. Crisp air, leaves turning golden red, and no rush to be anywhere. Recorded a quick voice note about being kind to myself when energy runs low.</p>',
        plainTextContent: 'A misty morning walk along the park path. Crisp air, leaves turning golden red, and no rush to be anywhere. Recorded a quick voice note about being kind to myself when energy runs low.',
        date: '2026-09-20',
        time: '11:15',
        rating: 3,
        mood: 'Calm',
        emotions: ['Calm', 'Tired'],
        tags: ['nature', 'walk', 'voice-diary'],
        location: { name: 'River Path Trail' },
        photos: [],
        voiceRecording: {
          id: 'voice-1',
          url: 'https://actions.google.com/sounds/v1/weather/wind_breeze.ogg',
          duration: 32,
          transcript: 'Just walking under the trees... feeling a bit tired from the week, but grateful for this calm pause.',
          createdAt: '2026-09-20T11:20:00.000Z',
        },
        aiReflection: {
          text: 'You recognized fatigue without judgment and chose rest in nature. Allowing yourself space to breathe is an essential part of sustaining long-term well-being.',
          generatedAt: '2026-09-20T11:30:00.000Z',
        },
        aiEmotions: [
          { emotion: 'Calmness', percentage: 60 },
          { emotion: 'Tiredness', percentage: 40 },
        ],
        aiSentiment: {
          sentiment: 'Neutral',
          explanation: 'Restorative and gentle reflection balancing tiredness with peaceful scenery.',
        },
        createdAt: '2026-09-20T11:15:00.000Z',
        updatedAt: '2026-09-20T11:15:00.000Z',
      },
      {
        id: 'entry-seed-4',
        userId: priscillaId,
        title: 'Birthday dinner & warm laughter',
        content: '<h1>Heart Full</h1><p>Gathered with close friends for dinner. We laughed until our sides hurt talking about memories from university. Truly thankful for the people who make life feel so light.</p>',
        plainTextContent: 'Gathered with close friends for dinner. We laughed until our sides hurt talking about memories from university. Truly thankful for the people who make life feel so light.',
        date: '2026-09-10',
        time: '20:30',
        rating: 5,
        mood: 'Loved',
        emotions: ['Loved', 'Happy', 'Grateful'],
        tags: ['celebration', 'friends', 'gratitude'],
        location: { name: 'Linden Bistro' },
        photos: [
          {
            id: 'photo-3',
            url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
            caption: 'Warm dinner gathering with dear friends',
            uploadedAt: '2026-09-10T21:00:00.000Z',
          }
        ],
        aiReflection: {
          text: 'Deep social connections consistently elevate your joy. Savoring these shared memories reinforces a sense of belonging and affection.',
          generatedAt: '2026-09-10T21:15:00.000Z',
        },
        aiEmotions: [
          { emotion: 'Love', percentage: 55 },
          { emotion: 'Happiness', percentage: 35 },
          { emotion: 'Gratitude', percentage: 10 },
        ],
        aiSentiment: {
          sentiment: 'Positive',
          explanation: 'Exceptionally warm and joyful celebration surrounded by loved ones.',
        },
        createdAt: '2026-09-10T20:30:00.000Z',
        updatedAt: '2026-09-10T20:30:00.000Z',
      }
    ];

    const reminders: Reminder[] = [
      {
        id: 'reminder-1',
        userId: priscillaId,
        reminderTime: '21:00',
        frequency: 'daily',
        message: 'Take a mindful breath and jot down one bright moment from today 🌸',
        enabled: true,
        createdAt: now,
      }
    ];

    const insights: AIInsight[] = [
      {
        id: 'insight-1',
        userId: priscillaId,
        text: 'You seem to record your highest daily ratings (4-5 ⭐) on days when you spend time outdoors or share meals with friends.',
        category: 'pattern',
        date: '2026-09-26',
      },
      {
        id: 'insight-2',
        userId: priscillaId,
        text: 'Writing down feelings of tiredness before bed has helped you transition into more calm, grounded mornings.',
        category: 'growth',
        date: '2026-09-22',
      },
      {
        id: 'insight-3',
        userId: priscillaId,
        text: 'You have maintained consistent diary entries throughout September with an average mood rating of 4.25 ⭐.',
        category: 'milestone',
        date: '2026-09-25',
      }
    ];

    this.data.users = [priscilla];
    this.data.entries = entries;
    this.data.reminders = reminders;
    this.data.insights = insights;
    this.data.sessions = [];
  }

  // User methods
  getUserByEmail(email: string): UserRecord | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  getUserById(id: string): UserRecord | undefined {
    return this.data.users.find(u => u.id === id);
  }

  createUser(user: UserRecord): UserRecord {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  deleteUser(id: string): boolean {
    const userIndex = this.data.users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;

    this.data.users.splice(userIndex, 1);
    this.data.sessions = this.data.sessions.filter(s => s.userId !== id);
    this.data.entries = this.data.entries.filter(e => e.userId !== id);
    this.data.reminders = this.data.reminders.filter(r => r.userId !== id);
    this.data.insights = this.data.insights.filter(i => i.userId !== id);
    this.save();
    return true;
  }

  // Session methods
  createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.data.sessions.push({
      token,
      userId,
      createdAt: new Date().toISOString(),
    });
    this.save();
    return token;
  }

  getSessionUser(token: string): UserRecord | undefined {
    const session = this.data.sessions.find(s => s.token === token);
    if (!session) return undefined;
    return this.getUserById(session.userId);
  }

  deleteSession(token: string): void {
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    this.save();
  }

  // Diary Entry methods
  getEntries(userId: string): DiaryEntry[] {
    return this.data.entries
      .filter(e => e.userId === userId)
      .sort((a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time));
  }

  getEntryById(id: string, userId: string): DiaryEntry | undefined {
    return this.data.entries.find(e => e.id === id && e.userId === userId);
  }

  createEntry(entry: DiaryEntry): DiaryEntry {
    this.data.entries.push(entry);
    this.save();
    return entry;
  }

  updateEntry(id: string, userId: string, updates: Partial<DiaryEntry>): DiaryEntry | undefined {
    const entry = this.getEntryById(id, userId);
    if (!entry) return undefined;
    Object.assign(entry, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return entry;
  }

  deleteEntry(id: string, userId: string): boolean {
    const initialLen = this.data.entries.length;
    this.data.entries = this.data.entries.filter(e => !(e.id === id && e.userId === userId));
    const deleted = this.data.entries.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // Reminders
  getReminders(userId: string): Reminder[] {
    return this.data.reminders.filter(r => r.userId === userId);
  }

  createReminder(reminder: Reminder): Reminder {
    this.data.reminders.push(reminder);
    this.save();
    return reminder;
  }

  updateReminder(id: string, userId: string, updates: Partial<Reminder>): Reminder | undefined {
    const reminder = this.data.reminders.find(r => r.id === id && r.userId === userId);
    if (!reminder) return undefined;
    Object.assign(reminder, updates);
    this.save();
    return reminder;
  }

  deleteReminder(id: string, userId: string): boolean {
    const initialLen = this.data.reminders.length;
    this.data.reminders = this.data.reminders.filter(r => !(r.id === id && r.userId === userId));
    const deleted = this.data.reminders.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // AI Insights
  getInsights(userId: string): AIInsight[] {
    return this.data.insights.filter(i => i.userId === userId);
  }

  createInsight(insight: AIInsight): AIInsight {
    this.data.insights.unshift(insight);
    // keep max 20 insights
    this.data.insights = this.data.insights.slice(0, 30);
    this.save();
    return insight;
  }

  // Reset or seed sample memories for any user
  seedSampleEntriesForUser(userId: string): void {
    const now = new Date();
    const existing = this.data.entries.filter(e => e.userId === userId);
    if (existing.length > 0) return; // already has entries

    const sample1: DiaryEntry = {
      id: crypto.randomUUID(),
      userId,
      title: 'Starting a new chapter in my life',
      content: '<h1>Starting Fresh</h1><p>Today marks the beginning of something really special. I spent the morning sitting by the garden, sipping chamomile tea, and setting my intentions for the future.</p><p>It is scary to let go of old routines, but there is so much peace in trusting where life is taking me.</p>',
      plainTextContent: 'Today marks the beginning of something really special. I spent the morning sitting by the garden, sipping chamomile tea, and setting my intentions for the future.',
      date: '2025-09-27',
      time: '09:30',
      rating: 5,
      mood: 'Grateful',
      emotions: ['Grateful', 'Calm', 'Loved'],
      tags: ['life', 'new-beginnings'],
      photos: [
        {
          id: crypto.randomUUID(),
          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
          caption: 'Golden morning light',
          uploadedAt: '2025-09-27T09:30:00.000Z',
        }
      ],
      aiReflection: {
        text: 'Embracing uncertainty with warmth and self-trust provided the grounding you needed.',
        generatedAt: '2025-09-27T10:00:00.000Z',
      },
      createdAt: '2025-09-27T09:30:00.000Z',
      updatedAt: '2025-09-27T09:30:00.000Z',
    };

    this.createEntry(sample1);
  }
}

export const db = new Database();
