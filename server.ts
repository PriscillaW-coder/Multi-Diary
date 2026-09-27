import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { db, hashPassword, verifyPassword, defaultPrivacySettings, UserRecord } from './server/db';
import {
  analyzeEmotionAndSentiment,
  generateReflection,
  generatePersonalizedPrompt,
  generatePersonalizedInsights,
  transcribeAudio,
  generateYearInReview,
} from './server/gemini';
import type { DiaryEntry, UserProfile, Reminder, AIInsight } from './src/types/diary';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware - allow up to 50MB for photo/audio base64 payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to sanitize user object for client
function sanitizeUser(user: UserRecord): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    privacySettings: user.privacySettings || defaultPrivacySettings,
    themePreference: user.themePreference || 'light',
  };
}

// Authentication middleware
interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.substring(7);
  const user = db.getSessionUser(token);
  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid' });
    return;
  }

  req.user = user;
  next();
}

// ================= AUTH ROUTES =================

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const userId = crypto.randomUUID();

  const newUser: UserRecord = {
    id: userId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
    privacySettings: { ...defaultPrivacySettings },
    themePreference: 'light',
  };

  db.createUser(newUser);
  const token = db.createSession(userId);

  // If registering as Priscilla or user wants starter memory, seed nice initial memory
  db.seedSampleEntriesForUser(userId);

  res.status(201).json({
    user: sanitizeUser(newUser),
    token,
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = db.createSession(user.id);
  res.json({
    user: sanitizeUser(user),
    token,
  });
});

app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    db.deleteSession(authHeader.substring(7));
  }
  res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: sanitizeUser(req.user!) });
});

app.post('/api/auth/change-password', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current and new password are required' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters' });
    return;
  }

  const isValid = verifyPassword(currentPassword, user.passwordHash, user.salt);
  if (!isValid) {
    res.status(401).json({ error: 'Incorrect current password' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  db.updateUser(user.id, { passwordHash: hash, salt });
  res.json({ success: true, message: 'Password updated successfully' });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ error: 'Email and new password are required' });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    res.status(404).json({ error: 'No account found with this email' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  db.updateUser(user.id, { passwordHash: hash, salt });
  res.json({ success: true, message: 'Password has been reset successfully. Please log in.' });
});

app.put('/api/auth/privacy-settings', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { privacySettings, themePreference } = req.body;
  const user = req.user!;

  const updates: Partial<UserRecord> = {};
  if (privacySettings) {
    updates.privacySettings = { ...user.privacySettings, ...privacySettings };
  }
  if (themePreference) {
    updates.themePreference = themePreference;
  }

  const updated = db.updateUser(user.id, updates);
  res.json({ user: sanitizeUser(updated!) });
});

app.delete('/api/auth/account', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  db.deleteUser(user.id);
  res.json({ success: true, message: 'Account and all associated diary records permanently deleted' });
});

app.post('/api/auth/seed-demo', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  db.seedSampleEntriesForUser(req.user!.id);
  res.json({ success: true, message: 'Sample memories added successfully' });
});

// ================= DIARY ENTRIES ROUTES =================

app.get('/api/entries', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let entries = db.getEntries(user.id);

  const { search, mood, rating, dateRange, startDate, endDate, archived, hasPhotos, hasVoice } = req.query;

  // Filter archived
  if (archived === 'true') {
    entries = entries.filter(e => e.archived);
  } else if (archived === 'false' || archived === undefined) {
    entries = entries.filter(e => !e.archived);
  }

  // Filter mood
  if (mood && typeof mood === 'string' && mood !== 'all') {
    entries = entries.filter(e => e.mood.toLowerCase() === mood.toLowerCase() || (e.emotions || []).some(em => em.toLowerCase() === mood.toLowerCase()));
  }

  // Filter rating
  if (rating) {
    const r = parseInt(rating as string, 10);
    if (!isNaN(r) && r > 0) {
      entries = entries.filter(e => e.rating === r);
    }
  }

  // Filter search
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    entries = entries.filter(e => {
      return (
        e.title.toLowerCase().includes(q) ||
        e.plainTextContent.toLowerCase().includes(q) ||
        (e.tags || []).some(t => t.toLowerCase().includes(q)) ||
        e.mood.toLowerCase().includes(q) ||
        (e.location?.name || '').toLowerCase().includes(q)
      );
    });
  }

  // Filter dates
  if (dateRange && typeof dateRange === 'string') {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (dateRange === 'today') {
      entries = entries.filter(e => e.date === todayStr);
    } else if (dateRange === 'this_week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().slice(0, 10);
      entries = entries.filter(e => e.date >= weekAgoStr && e.date <= todayStr);
    } else if (dateRange === 'this_month') {
      const monthPrefix = todayStr.slice(0, 7);
      entries = entries.filter(e => e.date.startsWith(monthPrefix));
    } else if (dateRange === 'custom') {
      if (startDate) entries = entries.filter(e => e.date >= (startDate as string));
      if (endDate) entries = entries.filter(e => e.date <= (endDate as string));
    }
  }

  if (hasPhotos === 'true') {
    entries = entries.filter(e => e.photos && e.photos.length > 0);
  }

  if (hasVoice === 'true') {
    entries = entries.filter(e => !!e.voiceRecording);
  }

  res.json({ entries });
});

app.get('/api/entries/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const entry = db.getEntryById(req.params.id, req.user!.id);
  if (!entry) {
    res.status(404).json({ error: 'Diary entry not found' });
    return;
  }
  res.json({ entry });
});

app.post('/api/entries', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const {
    title,
    content,
    plainTextContent,
    date,
    time,
    rating,
    mood,
    emotions,
    tags,
    location,
    photos,
    voiceRecording,
    musicAttachment,
    autoAnalyze,
  } = req.body;

  const now = new Date().toISOString();
  const entryId = crypto.randomUUID();

  // Strip HTML for clean plainTextContent if not provided
  const textContent = plainTextContent || (content ? content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '');

  const newEntry: DiaryEntry = {
    id: entryId,
    userId: user.id,
    title: (title || 'Untitled reflection').trim(),
    content: content || '<p></p>',
    plainTextContent: textContent,
    date: date || new Date().toISOString().slice(0, 10),
    time: time || new Date().toTimeString().slice(0, 5),
    rating: typeof rating === 'number' ? rating : 3,
    mood: mood || 'Calm',
    emotions: Array.isArray(emotions) ? emotions : [],
    tags: Array.isArray(tags) ? tags : [],
    location: location || undefined,
    photos: Array.isArray(photos) ? photos : [],
    voiceRecording: voiceRecording || undefined,
    musicAttachment: musicAttachment || undefined,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  // Run AI emotion & sentiment analysis if enabled
  if (autoAnalyze !== false && user.privacySettings?.aiDiaryAnalysis && user.privacySettings?.emotionDetection) {
    try {
      const analysis = await analyzeEmotionAndSentiment(textContent, user.privacySettings);
      if (analysis) {
        newEntry.aiEmotions = analysis.emotions;
        newEntry.aiSentiment = analysis.sentiment;
      }
    } catch (e) {
      console.error('Auto analysis error:', e);
    }
  }

  // Automatically generate AI companion reflection if not provided and privacy allows
  if (req.body.aiReflection) {
    newEntry.aiReflection = req.body.aiReflection;
  } else if (user.privacySettings?.aiDiaryAnalysis && user.privacySettings?.aiReflections) {
    try {
      const reflectionText = await generateReflection(
        {
          title: newEntry.title,
          plainTextContent: textContent || newEntry.title,
          rating: newEntry.rating,
          mood: newEntry.mood,
          date: newEntry.date,
        },
        user.privacySettings
      );
      if (reflectionText) {
        newEntry.aiReflection = {
          text: reflectionText,
          generatedAt: now,
        };
      }
    } catch (e) {
      console.error('Auto reflection generation error:', e);
    }
  }

  const created = db.createEntry(newEntry);
  res.status(201).json({ entry: created });
});

// Generate or regenerate reflection for a specific existing entry
app.post('/api/entries/:id/reflection', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const entry = db.getEntryById(req.params.id, user.id);
  if (!entry) {
    res.status(404).json({ error: 'Diary entry not found' });
    return;
  }

  if (!user.privacySettings?.aiDiaryAnalysis || !user.privacySettings?.aiReflections) {
    res.status(403).json({ error: 'AI reflections are disabled in your AI privacy settings' });
    return;
  }

  try {
    const reflectionText = await generateReflection(
      {
        title: entry.title,
        plainTextContent: entry.plainTextContent || entry.title,
        rating: entry.rating,
        mood: entry.mood,
        date: entry.date,
      },
      user.privacySettings
    );

    const updated = db.updateEntry(entry.id, user.id, {
      aiReflection: {
        text: reflectionText || 'Taking time to reflect on your journey brings clarity, peace, and quiet strength to each step forward.',
        generatedAt: new Date().toISOString(),
      },
    });

    res.json({ entry: updated, reflection: updated?.aiReflection });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate reflection' });
  }
});

app.put('/api/entries/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const existing = db.getEntryById(req.params.id, user.id);
  if (!existing) {
    res.status(404).json({ error: 'Diary entry not found' });
    return;
  }

  const updates = { ...req.body };
  delete updates.id;
  delete updates.userId;
  delete updates.createdAt;

  if (updates.content && !updates.plainTextContent) {
    updates.plainTextContent = updates.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const updated = db.updateEntry(req.params.id, user.id, updates);
  res.json({ entry: updated });
});

app.delete('/api/entries/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const deleted = db.deleteEntry(req.params.id, user.id);
  if (!deleted) {
    res.status(404).json({ error: 'Diary entry not found' });
    return;
  }
  res.json({ success: true, message: 'Diary entry permanently deleted' });
});

app.post('/api/entries/:id/duplicate', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const original = db.getEntryById(req.params.id, user.id);
  if (!original) {
    res.status(404).json({ error: 'Diary entry not found' });
    return;
  }

  const now = new Date().toISOString();
  const copy: DiaryEntry = {
    ...original,
    id: crypto.randomUUID(),
    title: `${original.title} (Copy)`,
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    createdAt: now,
    updatedAt: now,
  };

  const created = db.createEntry(copy);
  res.status(201).json({ entry: created });
});

app.post('/api/entries/:id/archive', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const entry = db.getEntryById(req.params.id, user.id);
  if (!entry) {
    res.status(404).json({ error: 'Diary entry not found' });
    return;
  }

  const updated = db.updateEntry(entry.id, user.id, { archived: !entry.archived });
  res.json({ entry: updated });
});

// "On This Day" - find memories from this same date (month and day) in past years
app.get('/api/on-this-day', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const today = new Date();
  const monthDay = today.toISOString().slice(5, 10); // MM-DD
  const currentYear = today.getFullYear().toString();

  const allEntries = db.getEntries(user.id);
  const pastMemories = allEntries.filter(e => {
    return e.date.endsWith(`-${monthDay}`) && !e.date.startsWith(currentYear);
  });

  res.json({ memories: pastMemories });
});

// ================= REMINDERS =================

app.get('/api/reminders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const reminders = db.getReminders(req.user!.id);
  res.json({ reminders });
});

app.post('/api/reminders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { reminderTime, frequency, message, enabled, daysOfWeek } = req.body;
  const user = req.user!;

  if (!reminderTime || !message) {
    res.status(400).json({ error: 'Reminder time and message are required' });
    return;
  }

  const newReminder: Reminder = {
    id: crypto.randomUUID(),
    userId: user.id,
    reminderTime,
    frequency: frequency || 'daily',
    daysOfWeek: daysOfWeek || [],
    message: message.trim(),
    enabled: enabled !== false,
    createdAt: new Date().toISOString(),
  };

  const created = db.createReminder(newReminder);
  res.status(201).json({ reminder: created });
});

app.put('/api/reminders/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const updated = db.updateReminder(req.params.id, user.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Reminder not found' });
    return;
  }
  res.json({ reminder: updated });
});

app.delete('/api/reminders/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const deleted = db.deleteReminder(req.params.id, user.id);
  if (!deleted) {
    res.status(404).json({ error: 'Reminder not found' });
    return;
  }
  res.json({ success: true });
});

// ================= AI ROUTES =================

app.post('/api/ai/emotion-sentiment', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { text } = req.body;

  if (!user.privacySettings?.aiDiaryAnalysis || !user.privacySettings?.emotionDetection) {
    res.status(403).json({ error: 'Emotion detection is disabled in your AI privacy settings' });
    return;
  }

  try {
    const analysis = await analyzeEmotionAndSentiment(text || '', user.privacySettings);
    res.json({ analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to analyze emotion and sentiment' });
  }
});

app.post('/api/ai/reflect', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { title, plainTextContent, rating, mood, date, entryId } = req.body;

  if (!user.privacySettings?.aiDiaryAnalysis || !user.privacySettings?.aiReflections) {
    res.status(403).json({ error: 'AI reflections are disabled in your AI privacy settings' });
    return;
  }

  try {
    const reflectionText = await generateReflection(
      { title, plainTextContent, rating, mood, date },
      user.privacySettings
    );

    // If entryId provided, optionally attach to entry in db
    if (entryId && reflectionText) {
      db.updateEntry(entryId, user.id, {
        aiReflection: {
          text: reflectionText,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    res.json({ reflection: reflectionText });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate reflection' });
  }
});

app.post('/api/ai/prompt', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { currentMood } = req.body;

  const entries = db.getEntries(user.id);
  try {
    const prompt = await generatePersonalizedPrompt(entries, currentMood, user.privacySettings);
    res.json({ prompt });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate prompt' });
  }
});

app.get('/api/ai/insights', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  if (!user.privacySettings?.aiDiaryAnalysis || !user.privacySettings?.personalizedInsights) {
    res.json({ insights: [] });
    return;
  }

  let insights = db.getInsights(user.id);
  const entries = db.getEntries(user.id);

  if (insights.length === 0 && entries.length > 0) {
    try {
      const generated = await generatePersonalizedInsights(entries, user.privacySettings);
      generated.forEach(item => db.createInsight(item));
      insights = db.getInsights(user.id);
    } catch (e) {
      console.error('Insights generation error:', e);
    }
  }

  res.json({ insights });
});

app.post('/api/ai/insights/refresh', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const entries = db.getEntries(user.id);

  try {
    const generated = await generatePersonalizedInsights(entries, user.privacySettings);
    generated.forEach(item => db.createInsight(item));
    res.json({ insights: db.getInsights(user.id) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to refresh insights' });
  }
});

app.post('/api/ai/transcribe', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { audioData, mimeType } = req.body;

  if (!audioData) {
    res.status(400).json({ error: 'Audio data is required' });
    return;
  }

  try {
    const transcript = await transcribeAudio(audioData, mimeType || 'audio/webm', user.privacySettings);
    res.json({ transcript });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to transcribe audio' });
  }
});

app.post('/api/ai/year-in-review', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const year = req.body.year ? parseInt(req.body.year, 10) : new Date().getFullYear();
  const entries = db.getEntries(user.id);

  try {
    const report = await generateYearInReview(year, entries, user.privacySettings);
    res.json({ report });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate Year In Review' });
  }
});

// Setup Vite or static files
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In dev, use Vite's middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist folder
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 Multi Diary Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server start error:', err);
  process.exit(1);
});
