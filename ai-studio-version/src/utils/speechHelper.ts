import { Language } from '../types';

let currentUtterance: SpeechSynthesisUtterance | null = null;

const LANG_CODE_MAP: Record<Language, string> = {
  odia: 'or-IN',
  hindi: 'hi-IN',
  bengali: 'bn-IN',
  tamil: 'ta-IN',
};

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakText(
  text: string,
  lang: Language,
  options?: {
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  }
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (options?.onEnd) options.onEnd();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    const langCode = LANG_CODE_MAP[lang] || 'hi-IN';
    utterance.lang = langCode;
    utterance.rate = options?.rate ?? 0.95; // Slightly slower for clarity
    utterance.pitch = options?.pitch ?? 1.0;

    const voices = window.speechSynthesis.getVoices();
    // Try matching language voice, fallback to any Indian English or default voice
    const matchedVoice =
      voices.find((v) => v.lang.startsWith(langCode.split('-')[0])) ||
      voices.find((v) => v.lang.includes('IN')) ||
      voices[0];

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      // Non-fatal fallback
      if (options?.onEnd) options.onEnd();
      if (options?.onError) options.onError(e);
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    if (options?.onEnd) options.onEnd();
  }
}
