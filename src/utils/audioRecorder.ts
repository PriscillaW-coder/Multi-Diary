/**
 * Helper to determine supported audio MIME types across browsers (Chrome, Firefox, Safari iOS/macOS)
 */
export function getSupportedAudioMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'audio/webm';
  }

  const preferredTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/wav',
    '',
  ];

  for (const type of preferredTypes) {
    if (!type) return '';
    try {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch (e) {
      // ignore
    }
  }

  return '';
}

/**
 * Safely create a MediaRecorder instance with fallback if mimeType fails
 */
export function createSafeMediaRecorder(stream: MediaStream): MediaRecorder {
  const preferredMime = getSupportedAudioMimeType();
  if (preferredMime) {
    try {
      return new MediaRecorder(stream, { mimeType: preferredMime });
    } catch (e) {
      console.warn(`MediaRecorder with ${preferredMime} failed, falling back to default`, e);
    }
  }
  // Default without mimeType
  return new MediaRecorder(stream);
}

/**
 * Format error message from getUserMedia failure
 */
export function getFriendlyAudioErrorMessage(err: any): string {
  if (!err) return 'Could not access microphone.';

  const name = err.name || '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Microphone access was denied. Please allow microphone permissions in your browser or iframe settings, or use the Demo Voice Note / Upload option.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No microphone was detected on this device. You can upload an audio file or generate a sample voice note.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Your microphone is currently in use by another tab or app. Please release it or try again.';
  }
  if (name === 'SecurityError') {
    return 'Microphone access is restricted by security policy. Please ensure the app has microphone permission.';
  }

  return err.message || 'Unable to start microphone recording.';
}

/**
 * Generates a valid, audible WAV audio file (synthesized peaceful bell chime tone)
 * represented as a data URI so users can always test voice recording playback and transcription
 */
export function createSampleVoiceRecording(sampleText: string = 'Today was a meaningful day. I took a few minutes to pause, breathe, and reflect on the moments that brought peace.'): { url: string; duration: number; transcript: string } {
  const sampleRate = 22050;
  const durationSec = 3.5;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Generate melodic gentle chime chords: 440Hz, 554Hz (C#), 659Hz (E)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 1.2); // natural decay
    const s1 = Math.sin(2 * Math.PI * 440 * t);
    const s2 = Math.sin(2 * Math.PI * 554.37 * t) * 0.7;
    const s3 = Math.sin(2 * Math.PI * 659.25 * t) * 0.5;
    const sample = Math.max(-1, Math.min(1, (s1 + s2 + s3) * 0.4 * env));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  // Convert buffer to base64 data URI
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const dataUrl = `data:audio/wav;base64,${base64}`;

  return {
    url: dataUrl,
    duration: Math.round(durationSec),
    transcript: sampleText,
  };
}

/**
 * Check if Web Speech API is available in current browser
 */
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

/**
 * Web Speech API instance helper for live voice dictation
 */
export function createSpeechRecognizer(
  onTranscript: (text: string, isFinal: boolean) => void,
  onError: (err: string) => void,
  onEnd: () => void
): { start: () => void; stop: () => void } | null {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  try {
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      onTranscript(final || interim, !!final);
    };

    recognition.onerror = (e: any) => {
      onError(e.error || 'Speech recognition error');
    };

    recognition.onend = () => {
      onEnd();
    };

    return {
      start: () => {
        try {
          recognition.start();
        } catch (e) {
          console.warn('SpeechRecognition start error:', e);
        }
      },
      stop: () => {
        try {
          recognition.stop();
        } catch (e) {
          console.warn('SpeechRecognition stop error:', e);
        }
      },
    };
  } catch (err) {
    console.error('Speech recognition setup error:', err);
    return null;
  }
}

