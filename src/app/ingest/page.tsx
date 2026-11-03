'use client';

import React from 'react';
import { useState, useCallback, useRef } from 'react';
import { ArrowLeft, Camera, FileText, Loader2, Sparkles, CheckCircle, AlertCircle, Pen, Trash2, Image as ImageIcon, Mic, Mic2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { PhotoOCR } from './components/PhotoOCR';
import { VoiceInput } from '@/components/VoiceInput';
import { parseCharacterFromText } from '@/lib/llm';
import { saveCharacter } from '@/lib/storage/indexeddb';
import { generateId } from '@/lib/utils';
import type { UniversalCharacter, AbilityScore } from '@/lib/character/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const INPUT_METHODS: Array<{ id: 'photo' | 'text' | 'voice' | 'manual'; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }> = [
  { id: 'photo', label: 'Photo of Character Sheet', icon: Camera, desc: 'Take a picture or upload an image' },
  { id: 'text', label: 'Paste Text / OCR Output', icon: FileText, desc: 'Copy-paste from digital sheet or OCR' },
  { id: 'voice', label: 'Read It Aloud', icon: Mic, desc: 'Speak their stats and details' },
  { id: 'manual', label: 'Guided Interview', icon: Pen, desc: 'Answer questions together' },
];

export default function IngestCharacterPage() {
  const router = useRouter();
  const [method, setMethod] = useState<'photo' | 'text' | 'voice' | 'manual'>('photo');
  const [stage, setStage] = useState<'choose' | 'input' | 'review' | 'saving'>('choose');
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [parsedCharacter, setParsedCharacter] = useState<UniversalCharacter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMethodSelect = (m: typeof method) => {
    setMethod(m);
    setStage('input');
    setError(null);
  };

  const handleBack = () => {
    setStage('choose');
    setParsedCharacter(null);
    setInputText('');
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    fileInputRef.current?.click();
  };

  const handleParse = async () => {
    if (method === 'photo' && !imageFile && !inputText.trim()) {
      setError('Please select an image first or paste text');
      return;
    }
    if (method === 'text' && !inputText.trim()) {
      setError('Please paste some text first');
      return;
    }
    if (method === 'voice' && !inputText.trim()) {
      setError('Please speak or paste some text first');
      return;
    }

    setError(null);
    try {
      const textToParse = inputText;

      const character = await parseCharacterFromText(textToParse);
      setParsedCharacter(character);
      setStage('review');
    } catch (err) {
      console.error('Parse error:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse character. Check your API key in settings.');
    }
  };

  const handleSave = async () => {
    if (!parsedCharacter) return;

    setSaving(true);
    try {
      const finalChar = {
        ...parsedCharacter,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      } as Parameters<typeof saveCharacter>[0];

      await saveCharacter(finalChar);
      router.push(`/character/${finalChar.id}`);
      router.refresh();
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save character');
    } finally {
      setSaving(false);
    }
  };

  const handleManualStart = () => {
    router.push('/create');
  };

  if (stage === 'choose') {
    return (
      <div className="min-h-screen bg-parchment-50">
        <header className="sticky top-0 z-10 bg-parchment-50/80 backdrop-blur-sm border-b border-ink-200">
          <div className="page-container py-4">
            <Link href="/" className="flex items-center gap-2 text-ink-600 hover:text-ink-900 mb-4 inline-flex">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-ink-900">Add Their Character</h1>
              <p className="text-ink-600 mt-1">Choose how you'll bring their hero into the app</p>
            </div>
          </div>
        </header>

        <main className="page-container py-8">
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4">
              {INPUT_METHODS.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleMethodSelect(m.id)}
                    className="p-6 rounded-xl border-2 border-ink-200 bg-parchment-50 hover:border-candlelight-400 hover:bg-candlelight-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-candlelight-100 border border-candlelight-300 flex items-center justify-center flex-shrink-0 group-hover:border-candlelight-400 transition-colors">
                        <Icon className="w-6 h-6 text-candlelight-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-ink-900 mb-1">{m.label}</h3>
                        <p className="text-sm text-ink-600">{m.desc}</p>
                      </div>
                    </div>
                    <Sparkles className="absolute top-3 right-3 w-5 h-5 text-candlelight-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>

            <Card variant="parchment" padding="lg" className="mt-8">
              <h3 className="font-bold text-ink-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-candlelight-600" />
                Tips for Best Results
              </h3>
              <ul className="space-y-2 text-sm text-ink-600">
                <li className="flex items-start gap-2"><span className="text-candlelight-600">•</span> For photos: Good lighting, flat surface, entire sheet visible</li>
                <li className="flex items-start gap-2"><span className="text-candlelight-600">•</span> For text: Copy from D&D Beyond, Roll20, or use phone OCR (Google Lens, Live Text)</li>
                <li className="flex items-start gap-2"><span className="text-candlelight-600">•</span> Include: name, class, level, race, ability scores, HP, AC, key features</li>
                <li className="flex items-start gap-2"><span className="text-candlelight-600">•</span> Don't worry about formatting — the AI handles messy input</li>
              </ul>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (method === 'manual') {
    return (
      <div className="min-h-screen bg-parchment-50 flex items-center justify-center page-container py-8">
        <Card variant="parchment" padding="lg" className="max-w-md w-full text-center">
          <Sparkles className="w-16 h-16 mx-auto text-candlelight-400 mb-4" />
          <h2 className="text-2xl font-bold text-ink-900 mb-2">Let's Build It Together</h2>
          <p className="text-ink-600 mb-6">The guided interview asks questions to create a character from scratch. Perfect if they don't have a sheet yet.</p>
          <Button size="lg" onClick={handleManualStart} className="w-full">
            <Pen className="w-5 h-5 mr-2" />
            Start Interview
          </Button>
          <Button variant="secondary" onClick={handleBack} className="w-full mt-3">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Choose Different Method
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment-50">
      <header className="sticky top-0 z-10 bg-parchment-50/80 backdrop-blur-sm border-b border-ink-200">
        <div className="page-container py-4">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-ink-900">{INPUT_METHODS.find(m => m.id === method)?.label}</h1>
            <p className="text-ink-600 mt-1">{stage === 'input' ? 'Provide the character details' : 'Review and save'}</p>
          </div>
        </div>
      </header>

      <main className="page-container py-8">
        <div className="max-w-3xl mx-auto">
          {/* Input Stage */}
          {stage === 'input' && (
            <Card variant="parchment" padding="lg">
              {method === 'photo' && (
                <PhotoOCR
                  onTextExtracted={(text) => setInputText(prev => prev + (prev ? '\n\n' : '') + text)}
                  onImageChange={(url) => {
                    setImagePreview(url);
                    if (!url) setImageFile(null);
                  }}
                />
              )}

              {method === 'text' && (
                <div className="space-y-4">
                  <Textarea
                    label="Paste Character Sheet Text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste from D&D Beyond, Roll20, Google Lens OCR, or type it out...

Example:
Name: Tharin
Class: Fighter (Battle Master) Level 5
Race: Human (Variant)
Str 16, Dex 14, Con 15, Int 10, Wis 12, Cha 13
HP: 44, AC: 18 (Chain Mail + Shield)
Attacks: Longsword +6 (1d8+3), Longbow +5 (1d8+3)
Features: Action Surge, Second Wind, Maneuvers..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-ink-500">
                    Don't worry about formatting — just paste everything you have. The AI will sort it out.
                  </p>
                </div>
              )}

              {method === 'voice' && (
                <VoiceInput
                  onTranscript={(text) => setInputText(prev => prev + (prev ? ' ' : '') + text)}
                  onError={(err) => setError(err)}
                />
              )}

              {error && (
                <div className="p-3 bg-ink-100 border border-ink-300 rounded-lg text-ink-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-ink-600 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={handleParse} loading={false} size="lg">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Parse Character
                </Button>
              </div>
            </Card>
          )}

          {/* Review Stage */}
          {stage === 'review' && parsedCharacter && (
            <>
              <Card variant="parchment" padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-ink-900">Parsed Character</h2>
                    <p className="text-ink-600">Review the details below. You can edit after saving.</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-candlelight-600" />
                </div>

                <CharacterPortrait
                  portrait={parsedCharacter.portrait}
                  abilities={parsedCharacter.abilities}
                  modifiers={parsedCharacter.modifiers}
                  compact
                />

                <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-parchment-50 rounded-lg">
                    <p className="text-ink-500">Level</p>
                    <p className="font-bold text-ink-900">{parsedCharacter.portrait.level}</p>
                  </div>
                  <div className="p-3 bg-parchment-50 rounded-lg">
                    <p className="text-ink-500">Class</p>
                    <p className="font-bold text-ink-900">{parsedCharacter.portrait.class}{parsedCharacter.portrait.subclass ? ` (${parsedCharacter.portrait.subclass})` : ''}</p>
                  </div>
                  <div className="p-3 bg-parchment-50 rounded-lg">
                    <p className="text-ink-500">Race</p>
                    <p className="font-bold text-ink-900">{parsedCharacter.portrait.race}</p>
                  </div>
                  <div className="p-3 bg-parchment-50 rounded-lg">
                    <p className="text-ink-500">Background</p>
                    <p className="font-bold text-ink-900">{parsedCharacter.portrait.background}</p>
                  </div>
                  <div className="p-3 bg-parchment-50 rounded-lg">
                    <p className="text-ink-500">HP / AC</p>
                    <p className="font-bold text-ink-900">{parsedCharacter.stats.hp.max} / {parsedCharacter.stats.ac}</p>
                  </div>
                  <div className="p-3 bg-parchment-50 rounded-lg">
                    <p className="text-ink-500">Proficiency</p>
                    <p className="font-bold text-ink-900">+{parsedCharacter.stats.proficiencyBonus}</p>
                  </div>
                </div>

                <details className="mt-6">
                  <summary className="text-sm text-ink-500 hover:text-ink-700 cursor-pointer font-medium">
                    Show Ability Scores
                  </summary>
                  <div className="mt-3 grid grid-cols-6 gap-2 text-center">
                    {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((ab) => (
                      <div key={ab} className="p-2 bg-parchment-50 rounded">
                        <div className="text-xs text-ink-500">{ab.slice(0, 3).toUpperCase()}</div>
                        <div className="font-bold text-ink-900">{parsedCharacter.abilities[ab]}</div>
                        <div className="text-sm text-candlelight-600">{parsedCharacter.modifiers[ab] >= 0 ? '+' : ''}{parsedCharacter.modifiers[ab]}</div>
                      </div>
                    ))}
                  </div>
                </details>
              </Card>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleSave} loading={saving} size="lg">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {saving ? 'Saving...' : 'Save Character'}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}