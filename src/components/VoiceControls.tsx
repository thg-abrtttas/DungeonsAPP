'use client';

import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, SkipBack, SkipForward, Pause, Play, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useVoice } from '@/hooks/useVoice';
import type { VoiceProfile } from '@/lib/voice/voiceProfiles';

interface VoiceControlsProps {
  /** Voice profile to use for speaking */
  profileId?: string;
  /** Text to speak when triggered */
  text?: string;
  /** Callback when speech starts */
  onStart?: () => void;
  /** Callback when speech ends */
  onEnd?: () => void;
  /** Show compact version */
  compact?: boolean;
  /** Custom label for the speak button */
  speakLabel?: string;
  /** Whether the text is currently being generated (streaming) */
  isGenerating?: boolean;
}

export function VoiceControls({
  profileId,
  text,
  onStart,
  onEnd,
  compact = false,
  speakLabel = 'Speak',
  isGenerating = false,
}: VoiceControlsProps) {
  const {
    profiles,
    isSpeaking: globalIsSpeaking,
    isPaused: globalIsPaused,
    currentUtterance,
    enabled,
    speak,
    pause,
    resume,
    stop,
    skip,
    testProfile,
    isSupported,
  } = useVoice();

  const profile = profiles.find(p => p.id === profileId) || profiles[0];
  const isSpeaking = globalIsSpeaking && currentUtterance?.profileId === profileId;
  const isPaused = globalIsPaused && currentUtterance?.profileId === profileId;
  const isCurrentProfile = currentUtterance?.profileId === profileId;

  const handleSpeak = () => {
    if (!text?.trim()) return;
    const id = speak(text, {
      profileId,
      onStart: () => onStart?.(),
      onEnd: () => onEnd?.(),
    });
    return id;
  };

  const handleTestProfile = () => {
    testProfile(profile);
  };

  if (!isSupported || !enabled) {
    return (
      <div className="text-xs text-ink-400 italic">
        Voice not supported in this browser
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant={isSpeaking ? 'primary' : isPaused ? 'secondary' : 'ghost'}
          size="sm"
          onClick={handleSpeak}
          disabled={!text?.trim() || isGenerating}
          loading={isGenerating}
          title={speakLabel}
          className="h-8 w-8 p-0"
        >
          {isSpeaking && !isPaused ? (
            <Mic className="w-4 h-4 text-candlelight-600" />
          ) : isPaused ? (
            <Pause className="w-4 h-4 text-ink-600" />
          ) : (
            <Mic className="w-4 h-4 text-ink-400" />
          )}
        </Button>
        {isSpeaking && isCurrentProfile && (
          <Button variant="ghost" size="sm" onClick={pause} className="h-8 w-8 p-0" title="Pause">
            <Pause className="w-4 h-4" />
          </Button>
        )}
        {isPaused && isCurrentProfile && (
          <Button variant="ghost" size="sm" onClick={resume} className="h-8 w-8 p-0" title="Resume">
            <Play className="w-4 h-4" />
          </Button>
        )}
        {(isSpeaking || isPaused) && isCurrentProfile && (
          <Button variant="ghost" size="sm" onClick={stop} className="h-8 w-8 p-0" title="Stop">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card variant="parchment" padding="sm" className="bg-parchment-50/50 border-ink-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-candlelight-100 text-candlelight-800 border border-candlelight-300">
            {profile.name}
          </span>
          <span className="text-xs text-ink-500 font-mono">
            {profile.lang} • Rate: {profile.rate} • Pitch: {profile.pitch}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleTestProfile} disabled={globalIsSpeaking} className="h-7">
            <Volume2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {text && (
        <div className="text-xs text-ink-600 mb-2 line-clamp-2 max-h-16 overflow-hidden">
          {text}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant={isSpeaking && isCurrentProfile ? 'primary' : isPaused && isCurrentProfile ? 'secondary' : 'primary'}
          size="sm"
          onClick={handleSpeak}
          disabled={!text?.trim() || isGenerating}
          loading={isGenerating}
          className="flex-1"
        >
          {isSpeaking && isCurrentProfile && !isPaused ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Speaking...
            </>
          ) : isPaused && isCurrentProfile ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Paused
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              {speakLabel}
            </>
          )}
        </Button>

        {isSpeaking && isCurrentProfile && (
          <>
            <Button variant="secondary" size="sm" onClick={pause} className="h-9">
              <Pause className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={skip} className="h-9">
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={stop} className="h-9">
              <X className="w-4 h-4" />
            </Button>
          </>
        )}

        {isPaused && isCurrentProfile && (
          <>
            <Button variant="primary" size="sm" onClick={resume} className="h-9">
              <Play className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={skip} className="h-9">
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={stop} className="h-9">
              <X className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Global controls when something is playing */}
      {(globalIsSpeaking && !isCurrentProfile) && (
        <div className="mt-2 pt-2 border-t border-ink-200 flex items-center gap-2 text-xs text-ink-500">
          <span>Playing: {currentUtterance?.text.slice(0, 40)}...</span>
          <Button variant="ghost" size="sm" onClick={stop}>
            Stop All
          </Button>
        </div>
      )}
    </Card>
  );
}

/** Floating voice control panel for the play session */
export function FloatingVoicePanel() {
  const {
    enabled,
    profiles,
    isSpeaking,
    isPaused,
    currentUtterance,
    queueLength,
    pause,
    resume,
    stop,
    skip,
  } = useVoice();

  if (!enabled || profiles.length === 0) return null;

  const isAnyPlaying = isSpeaking || isPaused;

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50
        transition-all duration-300
        ${isAnyPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      <Card variant="inked" padding="sm" className="shadow-xl border-candlelight-400 min-w-[280px]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-ink-900 flex items-center gap-2">
            <Mic className="w-4 h-4 text-candlelight-600" />
            Voice DM
          </h4>
          <Button variant="ghost" size="sm" onClick={stop} className="h-7 w-7 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {currentUtterance && (
          <div className="mb-2 p-2 bg-parchment-100 rounded border border-ink-200 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-ink-800">
                {profiles.find(p => p.id === currentUtterance?.profileId)?.name || 'Voice'}
              </span>
              <span className="text-ink-500 font-mono">
                {isPaused ? '⏸ Paused' : '▶ Playing'}
              </span>
            </div>
            <p className="text-ink-600 line-clamp-1">{currentUtterance.text}</p>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isSpeaking && !isPaused && (
            <Button variant="secondary" size="sm" onClick={pause} className="flex-1">
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          )}
          {isPaused && (
            <Button variant="primary" size="sm" onClick={resume} className="flex-1">
              <Play className="w-4 h-4 mr-1" />
              Resume
            </Button>
          )}
          {isAnyPlaying && (
            <Button variant="secondary" size="sm" onClick={skip} className="flex-1">
              <SkipForward className="w-4 h-4 mr-1" />
              Skip
            </Button>
          )}
          {isAnyPlaying && (
            <Button variant="ghost" size="sm" onClick={stop} className="h-9 w-9 p-0">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {queueLength > 1 && (
          <p className="mt-1 text-xs text-ink-400 text-center">
            {queueLength} queued
          </p>
        )}
      </Card>
    </div>
  );
}