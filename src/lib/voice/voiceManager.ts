/**
 * Voice Manager - Web Speech API Wrapper
 * Handles TTS playback, voice profiles, queuing, and playback control
 */

import type { VoiceProfile } from './voiceProfiles';
import { DEFAULT_VOICE_PROFILES } from './voiceProfiles';

type SpeechCallback = (event: SpeechSynthesisEvent) => void;

const defaultProfiles = DEFAULT_VOICE_PROFILES;

interface QueuedUtterance {
  id: string;
  text: string;
  profile: VoiceProfile;
  onStart?: SpeechCallback;
  onEnd?: SpeechCallback;
  onError?: SpeechCallback;
  onPause?: SpeechCallback;
  onResume?: SpeechCallback;
  onBoundary?: SpeechCallback;
}

class VoiceManager {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private profiles: VoiceProfile[] = [];
  private activeProfileId: string = 'narrator';
  private enabled: boolean = true;
  private queue: QueuedUtterance[] = [];
  private currentlySpeaking: QueuedUtterance | null = null;
  private isPaused: boolean = false;
  private listeners: Set<(state: VoiceManagerState) => void> = new Set();

  private getState(): VoiceManagerState {
    return {
      voices: this.voices,
      profiles: this.profiles,
      activeProfileId: this.activeProfileId,
      enabled: this.enabled,
      isSpeaking: this.synthesis?.speaking ?? false,
      isPaused: this.isPaused,
      queueLength: this.queue.length,
      currentUtterance: this.currentlySpeaking ? {
        id: this.currentlySpeaking.id,
        text: this.currentlySpeaking.text,
        profileId: this.currentlySpeaking.profile.id,
      } : null,
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      // Voices load asynchronously in some browsers
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synthesis) return;
    this.voices = this.synthesis.getVoices();
    if (this.profiles.length === 0 || this.profiles.every(p => !p.voiceURI)) {
      this.profiles = this.createProfilesFromVoices(this.voices);
    }
    this.notify();
  }

  private createProfilesFromVoices(voices: SpeechSynthesisVoice[]): VoiceProfile[] {
    const profileMap = new Map(defaultProfiles.map(p => [p.id, p]));

    const narratorVoice = voices.find(v =>
      v.lang.startsWith('en') &&
      (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('microsoft') || v.name.toLowerCase().includes('alex') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('enhanced'))
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    const femaleVoice = voices.find(v =>
      v.lang.startsWith('en') &&
      (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('victoria') || v.name.toLowerCase().includes('karen') || v.name.toLowerCase().includes('susan') || v.name.toLowerCase().includes('fiona'))
    ) || voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male')) || narratorVoice;

    const maleVoice = voices.find(v =>
      v.lang.startsWith('en') &&
      (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('alex') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('tom') || v.name.toLowerCase().includes('david'))
    ) || voices.find(v => v.lang.startsWith('en')) || narratorVoice;

    const monsterVoice = voices.find(v =>
      v.lang.startsWith('en') &&
      (v.name.toLowerCase().includes('deep') || v.name.toLowerCase().includes('bass') || v.name.toLowerCase().includes('dark') || v.name.toLowerCase().includes('heavy'))
    ) || maleVoice;

    return [
      { ...profileMap.get('narrator')!, voiceURI: narratorVoice?.voiceURI || '' },
      { ...profileMap.get('npc-female')!, voiceURI: femaleVoice?.voiceURI || '' },
      { ...profileMap.get('npc-male')!, voiceURI: maleVoice?.voiceURI || '' },
      { ...profileMap.get('monster')!, voiceURI: monsterVoice?.voiceURI || '' },
      { ...profileMap.get('custom-1')!, voiceURI: voices[0]?.voiceURI || '' },
    ];
  }

  // Subscribe to state changes
  subscribe(listener: (state: VoiceManagerState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  // Get current state snapshot
  getSnapshot(): VoiceManagerState {
    return this.getState();
  }

  // Update voice profiles (from settings)
  setProfiles(profiles: VoiceProfile[]) {
    this.profiles = profiles;
    this.notify();
  }

  // Set active profile
  setActiveProfile(profileId: string) {
    const profile = this.profiles.find(p => p.id === profileId);
    if (profile) {
      this.activeProfileId = profileId;
      this.notify();
    }
  }

  // Enable/disable voice globally
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
    this.notify();
  }

  // Get profile by ID
  getProfile(profileId?: string): VoiceProfile {
    const id = profileId || this.activeProfileId;
    return this.profiles.find(p => p.id === id) || this.profiles[0];
  }

  // Speak text with a specific profile (or active profile)
  speak(
    text: string,
    options: {
      profileId?: string;
      onStart?: SpeechCallback;
      onEnd?: SpeechCallback;
      onError?: SpeechCallback;
      onPause?: SpeechCallback;
      onResume?: SpeechCallback;
      onBoundary?: SpeechCallback;
    } = {}
  ): string {
    if (!this.enabled || !this.synthesis || !text.trim()) {
      options.onError?.(new Event('error') as SpeechSynthesisEvent);
      return '';
    }

    const profile = this.getProfile(options.profileId);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.voices.find(v => v.voiceURI === profile.voiceURI) || null;
    utterance.lang = profile.lang;
    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;
    utterance.volume = profile.volume;

    const id = crypto.randomUUID();

    const queued: QueuedUtterance = {
      id,
      text,
      profile,
      onStart: options.onStart,
      onEnd: options.onEnd,
      onError: options.onError,
      onPause: options.onPause,
      onResume: options.onResume,
      onBoundary: options.onBoundary,
    };

    utterance.onstart = (e) => {
      this.currentlySpeaking = queued;
      this.isPaused = false;
      this.notify();
      queued.onStart?.(e);
    };

    utterance.onend = (e) => {
      this.currentlySpeaking = null;
      this.queue.shift();
      this.notify();
      queued.onEnd?.(e);
      this.processQueue();
    };

    utterance.onerror = (e) => {
      this.currentlySpeaking = null;
      this.queue.shift();
      this.notify();
      queued.onError?.(e);
      this.processQueue();
    };

    utterance.onpause = (e) => {
      this.isPaused = true;
      this.notify();
      queued.onPause?.(e);
    };

    utterance.onresume = (e) => {
      this.isPaused = false;
      this.notify();
      queued.onResume?.(e);
    };

    utterance.onboundary = (e) => {
      queued.onBoundary?.(e);
    };

    this.queue.push(queued);

    if (!this.synthesis.speaking && !this.isPaused) {
      this.processQueue();
    }

    return id;
  }

  private processQueue() {
    if (this.queue.length === 0 || this.isPaused || !this.synthesis) return;

    const next = this.queue[0];
    if (next && this.currentlySpeaking === null) {
      const utterance = new SpeechSynthesisUtterance(next.text);
      utterance.voice = this.voices.find(v => v.voiceURI === next.profile.voiceURI) || null;
      utterance.lang = next.profile.lang;
      utterance.rate = next.profile.rate;
      utterance.pitch = next.profile.pitch;
      utterance.volume = next.profile.volume;

      utterance.onstart = (e) => {
        this.currentlySpeaking = next;
        this.isPaused = false;
        this.notify();
        next.onStart?.(e);
      };

      utterance.onend = (e) => {
        this.currentlySpeaking = null;
        this.queue.shift();
        this.notify();
        next.onEnd?.(e);
        this.processQueue();
      };

      utterance.onerror = (e) => {
        this.currentlySpeaking = null;
        this.queue.shift();
        this.notify();
        next.onError?.(e);
        this.processQueue();
      };

      utterance.onpause = (e) => {
        this.isPaused = true;
        this.notify();
        next.onPause?.(e);
      };

      utterance.onresume = (e) => {
        this.isPaused = false;
        this.notify();
        next.onResume?.(e);
      };

      utterance.onboundary = (e) => {
        next.onBoundary?.(e);
      };

      this.synthesis.speak(utterance);
    }
  }

  // Pause current speech
  pause() {
    if (this.synthesis?.speaking && !this.isPaused) {
      this.synthesis.pause();
      this.isPaused = true;
      this.notify();
    }
  }

  // Resume paused speech
  resume() {
    if (this.synthesis?.paused) {
      this.synthesis.resume();
      this.isPaused = false;
      this.notify();
    }
  }

  // Stop current speech and clear queue
  stop() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.queue = [];
      this.currentlySpeaking = null;
      this.isPaused = false;
      this.notify();
    }
  }

  // Skip current utterance
  skip() {
    if (this.synthesis?.speaking) {
      this.synthesis.cancel(); // This will trigger onend for current, then processQueue will play next
    }
  }

  // Get available voices
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  // Test a profile
  testProfile(profile: VoiceProfile) {
    const testText = `This is the ${profile.name} voice. Ready for adventure!`;
    return this.speak(testText, { profileId: profile.id });
  }
}

// Singleton instance
export const voiceManager = new VoiceManager();

// State type for subscribers
export interface VoiceManagerState {
  voices: SpeechSynthesisVoice[];
  profiles: VoiceProfile[];
  activeProfileId: string;
  enabled: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  queueLength: number;
  currentUtterance: {
    id: string;
    text: string;
    profileId: string;
  } | null;
}

// Helper hook for React components (will be in useVoice.ts)
export function useVoiceManager() {
  return voiceManager;
}