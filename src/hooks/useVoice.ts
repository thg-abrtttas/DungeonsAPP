'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { voiceManager, type VoiceManagerState } from '@/lib/voice/voiceManager';
import type { VoiceProfile } from '@/lib/voice/voiceProfiles';

export function useVoice() {
  const [state, setState] = useState<VoiceManagerState>(voiceManager.getSnapshot());
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  useEffect(() => {
    // Initial state
    setState(voiceManager.getSnapshot());
    setVoicesLoaded(voiceManager.getVoices().length > 0);

    // Subscribe to changes
    const unsubscribe = voiceManager.subscribe((newState) => {
      setState(newState);
      setVoicesLoaded(newState.voices.length > 0);
    });

    return unsubscribe;
  }, []);

  const speak = useCallback((
    text: string,
    options: {
      profileId?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: SpeechSynthesisErrorEvent) => void;
    } = {}
  ) => {
    return voiceManager.speak(text, {
      profileId: options.profileId,
      onStart: () => options.onStart?.(),
      onEnd: () => options.onEnd?.(),
      onError: (e) => options.onError?.(e as SpeechSynthesisErrorEvent),
    });
  }, []);

  const pause = useCallback(() => voiceManager.pause(), []);
  const resume = useCallback(() => voiceManager.resume(), []);
  const stop = useCallback(() => voiceManager.stop(), []);
  const skip = useCallback(() => voiceManager.skip(), []);

  const setEnabled = useCallback((enabled: boolean) => voiceManager.setEnabled(enabled), []);
  const setActiveProfile = useCallback((profileId: string) => voiceManager.setActiveProfile(profileId), []);
  const setProfiles = useCallback((profiles: VoiceProfile[]) => voiceManager.setProfiles(profiles), []);

  const testProfile = useCallback((profile: VoiceProfile) => voiceManager.testProfile(profile), []);

  const getProfile = useCallback((profileId?: string) => voiceManager.getProfile(profileId), []);

  return {
    // State
    ...state,
    voicesLoaded,
    isSupported: state.voices.length > 0,

    // Actions
    speak,
    pause,
    resume,
    stop,
    skip,
    setEnabled,
    setActiveProfile,
    setProfiles,
    testProfile,
    getProfile,
  };
}

// Hook for getting available voices for settings
export function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const v = voiceManager.getVoices();
      setVoices(v);
    };

    loadVoices();
    const unsubscribe = voiceManager.subscribe((state) => {
      setVoices(state.voices);
    });

    return unsubscribe;
  }, []);

  return voices;
}