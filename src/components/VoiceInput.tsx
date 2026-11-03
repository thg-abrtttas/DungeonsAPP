'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

// Type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

export function VoiceInput({ onTranscript, onError, language = 'en-US' }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              interimTranscript += result[0].transcript;
            }
          }

          if (finalTranscript) {
            setTranscript(prev => prev + ' ' + finalTranscript);
            onTranscript(finalTranscript);
          }
          setInterimTranscript(interimTranscript);
        };

        recognition.onerror = (event) => {
          const errMsg = event.error === 'no-speech'
            ? 'No speech detected. Try again.'
            : event.error === 'audio-capture'
              ? 'No microphone found. Check permissions.'
              : event.error === 'not-allowed'
                ? 'Microphone access denied. Allow in browser settings.'
                : `Speech recognition error: ${event.error}`;
          setError(errMsg);
          onError?.(errMsg);
          setListening(false);
        };

        recognition.onend = () => {
          if (listening) {
            // Restart if still supposed to be listening
            try {
              recognition.start();
            } catch {
              setListening(false);
            }
          }
        };

        recognitionRef.current = recognition;
      } else {
        setSupported(false);
        setError('Speech recognition not supported in this browser. Use Chrome, Edge, or Safari.');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, listening, onTranscript, onError]);

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (err) {
        setError('Could not start microphone. Check permissions.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  const useTranscript = () => {
    if (transcript.trim()) {
      onTranscript(transcript);
    }
  };

  if (!supported) {
    return (
      <Card variant="parchment" padding="lg" className="bg-ink-50 border-ink-200">
        <div className="text-center py-8">
          <MicOff className="w-16 h-16 mx-auto text-ink-300 mb-4" />
          <h3 className="text-xl font-bold text-ink-900 mb-2">Voice Input Not Supported</h3>
          <p className="text-ink-600 mb-4">
            Speech recognition requires Chrome, Edge, or Safari with microphone permissions.
          </p>
          <p className="text-sm text-ink-500">
            On iOS: Use Safari with "Speak Selection" in Settings → Accessibility → Spoken Content
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="parchment" padding="lg">
      <div className="space-y-6">
        {/* Main Mic Button */}
        <div className="text-center">
          <Button
            variant={listening ? 'primary' : 'secondary'}
            size="lg"
            onClick={listening ? stopListening : startListening}
            className="w-20 h-20 rounded-full p-0"
            disabled={listening && !interimTranscript && !transcript}
          >
            {listening ? (
              <Mic className="w-10 h-10 text-candlelight-600 animate-pulse" />
            ) : (
              <Mic className="w-10 h-10 text-ink-600" />
            )}
          </Button>

          <p className="mt-3 text-sm font-medium text-ink-900">
            {listening ? 'Listening...' : 'Tap to Start'}
          </p>

          {listening && (
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-ink-500">
              <Loader2 className="w-4 h-4 animate-spin text-candlelight-600" />
              <span>Speak now</span>
            </div>
          )}
        </div>

        {/* Live Transcript Display */}
        {(transcript || interimTranscript) && (
          <div className="relative">
            <div className="bg-parchment-100 border border-ink-200 rounded-lg p-4 min-h-[120px] max-h-64 overflow-y-auto">
              <p className="text-sm text-ink-800 whitespace-pre-wrap font-mono leading-relaxed">
                {transcript}
                {interimTranscript && (
                  <span className="text-ink-400 italic">{interimTranscript}</span>
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={clearTranscript} disabled={!transcript && !interimTranscript}>
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <Button variant="primary" size="sm" onClick={useTranscript} disabled={!transcript.trim()}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Use Text
                </Button>
              </div>

              <span className="text-xs text-ink-500 font-mono">
                {transcript.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
          </div>
        )}

        {/* Tips */}
        <details className="group">
          <summary className="text-sm text-ink-500 hover:text-ink-700 cursor-pointer flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Tips for Better Recognition
          </summary>
          <ul className="mt-3 space-y-1 text-xs text-ink-600 pl-6 list-disc">
            <li>Speak clearly at a moderate pace</li>
            <li>Quiet environment works best</li>
            <li>Say punctuation: "period", "comma", "new line"</li>
            <li>Pause between distinct stats: "Strength sixteen. Dexterity fourteen."</li>
            <li>If it stops: tap the mic again to continue</li>
          </ul>
        </details>

        {error && (
          <div className="p-3 bg-ink-100 border border-ink-300 rounded-lg text-ink-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-ink-600 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    </Card>
  );
}
